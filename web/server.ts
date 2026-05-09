import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { getPromptTemplate, getScreenMode, renderPrompt, runCliCommand, setPromptTemplate, setScreenMode } from "../cli/aliases";
import { parseArgs } from "../cli/parser";
import { dispatchCommand } from "../engine/commands";
import { createInitialState, getCwd, type SystemState } from "../engine/state";
import { renderWebPage } from "./renderPage";

type Session = {
  state: SystemState;
  lastSeen: number;
};

const PORT = Number(process.env.PORT ?? "3000");
const DEFAULT_SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS ?? String(30 * 60 * 1000));

type WebServerOptions = {
  sessionTtlMs?: number;
  now?: () => number;
};

type WebServerContext = {
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
  setScreenMode(state, "cga");
  setPromptTemplate(state, getPromptTemplate(state));
  context.sessions.set(sessionId, { state, lastSeen: context.now() });

  const motd = dispatchCommand(state, "open", ["/system/motd.txt"]);
  dispatchCommand(state, "cd", ["/home"]);

  sendJson(res, 200, {
    sessionId,
    cwd: getCwd(state),
    screenMode: getScreenMode(state),
    prompt: renderPrompt(state),
    lines: [
      "BOOTING ASCII-OS WEB...",
      "LOADING CONTENT FROM /content/data...",
      "INITIALIZING USER SESSION...",
      "WELCOME, OPERATOR",
      "",
      motd.output
    ]
  });
};

const handleCommand = async (req: IncomingMessage, res: ServerResponse, context: WebServerContext): Promise<void> => {
  cleanupExpiredSessions(context);
  const body = await readJson(req);
  const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
  const input = typeof body.input === "string" ? body.input : "";
  const session = context.sessions.get(sessionId);
  if (!session) {
    sendJson(res, 400, { error: "Invalid session" });
    return;
  }
  touchSession(session, context.now);

  const parsed = parseArgs(input);
  if (parsed.length === 0) {
    sendJson(res, 200, {
      output: "",
      cwd: getCwd(session.state),
      exit: false,
      screenMode: getScreenMode(session.state),
      prompt: renderPrompt(session.state)
    });
    return;
  }

  const [command, ...args] = parsed;
  const result = runCliCommand(session.state, command, args);
  let rebootLines: string[] = [];

  if (result.reboot) {
    const preservedMode = getScreenMode(session.state);
    const preservedPromptTemplate = getPromptTemplate(session.state);
    const freshState = createInitialState();
    setScreenMode(freshState, preservedMode);
    setPromptTemplate(freshState, preservedPromptTemplate);
    session.state = freshState;
    const motd = dispatchCommand(freshState, "open", ["/system/motd.txt"]);
    dispatchCommand(freshState, "cd", ["/home"]);
    rebootLines = [
      "REBOOTING ASCII-OS WEB...",
      "LOADING CONTENT FROM /content/data...",
      "INITIALIZING USER SESSION...",
      "WELCOME, OPERATOR",
      "",
      motd.output
    ];
  }

  sendJson(res, 200, {
    output: result.output,
    cwd: getCwd(session.state),
    prompt: renderPrompt(session.state),
    exit: result.exit === true,
    clear: result.clear === true,
    reboot: result.reboot === true,
    rebootLines,
    screenMode: result.screenMode ?? (result.reboot ? getScreenMode(session.state) : null)
  });
};

export const createWebServer = (options: WebServerOptions = {}) => {
  const context: WebServerContext = {
    sessions: new Map<string, Session>(),
    sessionTtlMs: options.sessionTtlMs ?? DEFAULT_SESSION_TTL_MS,
    now: options.now ?? Date.now
  };

  return createServer(async (req, res) => {
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

    res.statusCode = 404;
    res.end("Not found");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    sendJson(res, 500, { error: message });
  }
});
};

if (require.main === module) {
  const server = createWebServer();
  server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`ascii-os web listening on http://localhost:${PORT}`);
  });
}
