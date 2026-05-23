import { type IncomingMessage, type ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { getScreenMode, renderPrompt, runCliCommand } from "../cli/aliases";
import { parseArgs } from "../engine/parser";
import { dispatchCommand } from "../engine/commands";
import { getDirectoryAtPath, getNodeAtPath } from "../engine/path";
import { createInitialState, createStatelessState, getCwd, toSerializableState, type SerializableState, type SystemState } from "../engine/state";
import { renderWebPage } from "./renderPage";

type Session = {
  state: SystemState;
  lastSeen: number;
};

const DEFAULT_SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS ?? String(30 * 60 * 1000));

export type WebServerContext = {
  sessions: Map<string, Session>;
  sessionTtlMs: number;
  now: () => number;
};

const sendJson = (res: ServerResponse, status: number, body: unknown): void => {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
};

const readJson = async (req: IncomingMessage): Promise<Record<string, unknown>> => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) {
    return {};
  }

  return JSON.parse(raw);
};

const cleanupExpiredSessions = ({ sessions, sessionTtlMs, now }: WebServerContext): void => {
  const cutoff = now() - sessionTtlMs;
  for (const [sessionId, session] of sessions) {
    if (session.lastSeen < cutoff) {
      sessions.delete(sessionId);
    }
  }
};

const touchSession = (session: Session, now: () => number): void => {
  session.lastSeen = now();
};

const handleHealth = (res: ServerResponse, context: WebServerContext): void => {
  cleanupExpiredSessions(context);
  sendJson(res, 200, {
    status: "ok",
    sessions: context.sessions.size,
    sessionTtlMs: context.sessionTtlMs
  });
};

const handleInit = (res: ServerResponse, context: WebServerContext): void => {
  cleanupExpiredSessions(context);
  const state = createInitialState();
  const sessionId = randomUUID();
  context.sessions.set(sessionId, { state, lastSeen: context.now() });

  const motd = dispatchCommand(state, "open", ["/system/motd.txt"]);
  const version = "ASCII-OS BIOS v1.0.7-DEBUG (C) 1973-2026";
  dispatchCommand(state, "cd", ["/home"]);

  sendJson(res, 200, {
    sessionId,
    state: toSerializableState(state),
    cwd: getCwd(state),
    screenMode: getScreenMode(state),
    theme: state.config.theme,
    prompt: renderPrompt(state),
    lines: [
      version,
      "CPU: CORE-8086 AT 4.77MHz",
      "MEMORY TEST: 640KB OK",
      "",
      "LOADING KERNEL...",
      "LOADING FILE SYSTEM...",
      "CONTENT LOADED FROM /content/data",
      "INITIALIZING USER SESSION...",
      "",
      "WELCOME, OPERATOR",
      "",
      motd.output
    ]
  });
};

const getStateFromRequest = (body: Record<string, unknown>, context: WebServerContext): SystemState | null => {
  // Try stateless approach first
  if (body.state && typeof body.state === "object") {
    return createStatelessState(body.state as SerializableState);
  }

  // Fallback to session-based (for local dev and backward compatibility)
  const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
  const session = context.sessions.get(sessionId);
  if (session) {
    touchSession(session, context.now);
    return session.state;
  }

  return null;
};

const handleCommand = async (req: IncomingMessage, res: ServerResponse, context: WebServerContext): Promise<void> => {
  cleanupExpiredSessions(context);
  const body = await readJson(req);
  const input = typeof body.input === "string" ? body.input : "";
  
  const state = getStateFromRequest(body, context);
  if (!state) {
    sendJson(res, 400, { error: "Invalid session or state" });
    return;
  }

  const parsed = parseArgs(input);
  if (parsed.length === 0) {
    sendJson(res, 200, {
      output: "",
      state: toSerializableState(state),
      cwd: getCwd(state),
      exit: false,
      screenMode: getScreenMode(state),
      prompt: renderPrompt(state)
    });
    return;
  }

  const [command, ...args] = parsed;
  const result = runCliCommand(state, command, args);
  let rebootLines: string[] = [];

  if (result.reboot) {
    const preservedConfig = { ...state.config };
    const freshState = createInitialState();
    freshState.config = preservedConfig;
    // We update the state object in place or replace it if it's from session
    // For stateless, we just return the new state
    const motd = dispatchCommand(freshState, "open", ["/system/motd.txt"]);
    dispatchCommand(freshState, "cd", ["/home"]);
    
    // Update state to fresh if it was a session
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
    const session = context.sessions.get(sessionId);
    if (session) {
      session.state = freshState;
    }

    rebootLines = [
      "SYSTEM REBOOT INITIATED...",
      "",
      "ASCII-OS BIOS v1.0.7-DEBUG (C) 1973-2026",
      "CPU: CORE-8086 AT 4.77MHz",
      "MEMORY TEST: 640KB OK",
      "",
      "LOADING KERNEL...",
      "LOADING FILE SYSTEM...",
      "CONTENT LOADED FROM /content/data",
      "INITIALIZING USER SESSION...",
      "",
      "WELCOME, OPERATOR",
      "",
      motd.output
    ];

    sendJson(res, 200, {
      output: result.output,
      state: toSerializableState(freshState),
      cwd: getCwd(freshState),
      prompt: renderPrompt(freshState),
      exit: !!result.exit,
      clear: !!result.clear,
      reboot: true,
      animate: !!result.animate,
      aocMode: !!result.aocMode,
      rebootLines,
      screenMode: getScreenMode(freshState),
      theme: freshState.config.theme
    });
    return;
  }

  sendJson(res, 200, {
    output: result.output,
    state: toSerializableState(state),
    cwd: getCwd(state),
    prompt: renderPrompt(state),
    exit: !!result.exit,
    clear: !!result.clear,
    reboot: !!result.reboot,
    animate: !!result.animate,
    aocMode: !!result.aocMode,
    rebootLines,
    screenMode: result.screenMode ?? getScreenMode(state),
    theme: result.theme ?? state.config.theme
  });
};

const handleAoc = async (req: IncomingMessage, res: ServerResponse, context: WebServerContext): Promise<void> => {
  cleanupExpiredSessions(context);
  const body = await readJson(req);
  const state = getStateFromRequest(body, context);
  if (!state) {
    sendJson(res, 400, { error: "Invalid session or state" });
    return;
  }

  const action = typeof body.action === "string" ? body.action : "list";
  const path = typeof body.path === "string" ? body.path : getCwd(state);

  if (action === "list") {
    const dir = getDirectoryAtPath(state.root, path);
    if (!dir) {
      sendJson(res, 404, { error: "Not a directory" });
      return;
    }

    const entries = Object.entries(dir.children)
      .map(([name, node]) => ({ name, isDir: node.kind === "dir" }))
      .sort((a, b) => {
        if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

    if (path !== "/") {
      entries.unshift({ name: "..", isDir: true });
    }

    sendJson(res, 200, { entries, path, state: toSerializableState(state) });
    return;
  }

  if (action === "preview") {
    const itemPath = typeof body.itemPath === "string" ? body.itemPath : path;
    const node = getNodeAtPath(state.root, itemPath);
    if (!node) {
      sendJson(res, 404, { error: "Not found" });
      return;
    }

    let preview = "";
    if (node.kind === "dir") {
      preview = dispatchCommand(state, "tree", [itemPath]).output;
    } else {
      preview = node.content;
    }

    sendJson(res, 200, { preview, state: toSerializableState(state) });
    return;
  }

  sendJson(res, 400, { error: "Unknown action" });
};

export const createWebHandler = (options: { sessionTtlMs?: number; now?: () => number } = {}) => {
  const context: WebServerContext = {
    sessions: new Map<string, Session>(),
    sessionTtlMs: options.sessionTtlMs ?? DEFAULT_SESSION_TTL_MS,
    now: options.now ?? Date.now
  };

  return async (req: IncomingMessage, res: ServerResponse) => {
    try {
      if (!req.url || !req.method) {
        res.statusCode = 400;
        res.end("Bad request");
        return;
      }

      if (req.method === "GET" && req.url === "/") {
        res.statusCode = 200;
        res.setHeader("content-type", "text/html; charset=utf-8");
        res.end(renderWebPage());
        return;
      }

      if (req.method === "GET" && req.url === "/health") {
        handleHealth(res, context);
        return;
      }

      if (req.method === "POST" && req.url === "/api/init") {
        handleInit(res, context);
        return;
      }

      if (req.method === "POST" && req.url === "/api/command") {
        await handleCommand(req, res, context);
        return;
      }

      if (req.method === "POST" && req.url === "/api/aoc") {
        await handleAoc(req, res, context);
        return;
      }

      res.statusCode = 404;
      res.end("Not found");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      sendJson(res, 500, { error: message });
    }
  };
};
