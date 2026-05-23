"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWebHandler = void 0;
const node_crypto_1 = require("node:crypto");
const aliases_1 = require("../cli/aliases");
const parser_1 = require("../engine/parser");
const commands_1 = require("../engine/commands");
const path_1 = require("../engine/path");
const state_1 = require("../engine/state");
const renderPage_1 = require("./renderPage");
const DEFAULT_SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS ?? String(30 * 60 * 1000));
const sendJson = (res, status, body) => {
    res.statusCode = status;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(JSON.stringify(body));
};
const readJson = async (req) => {
    const chunks = [];
    for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const raw = Buffer.concat(chunks).toString("utf8").trim();
    if (!raw) {
        return {};
    }
    return JSON.parse(raw);
};
const cleanupExpiredSessions = ({ sessions, sessionTtlMs, now }) => {
    const cutoff = now() - sessionTtlMs;
    for (const [sessionId, session] of sessions) {
        if (session.lastSeen < cutoff) {
            sessions.delete(sessionId);
        }
    }
};
const touchSession = (session, now) => {
    session.lastSeen = now();
};
const handleHealth = (res, context) => {
    cleanupExpiredSessions(context);
    sendJson(res, 200, {
        status: "ok",
        sessions: context.sessions.size,
        sessionTtlMs: context.sessionTtlMs
    });
};
const handleInit = (res, context) => {
    cleanupExpiredSessions(context);
    const state = (0, state_1.createInitialState)();
    const sessionId = (0, node_crypto_1.randomUUID)();
    context.sessions.set(sessionId, { state, lastSeen: context.now() });
    const motd = (0, commands_1.dispatchCommand)(state, "open", ["/system/motd.txt"]);
    const version = "ASCII-OS BIOS v1.0.7-DEBUG (C) 1973-2026";
    (0, commands_1.dispatchCommand)(state, "cd", ["/home"]);
    sendJson(res, 200, {
        sessionId,
        state: (0, state_1.toSerializableState)(state),
        cwd: (0, state_1.getCwd)(state),
        screenMode: (0, aliases_1.getScreenMode)(state),
        theme: state.config.theme,
        prompt: (0, aliases_1.renderPrompt)(state),
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
const getStateFromRequest = (body, context) => {
    // Try stateless approach first
    if (body.state && typeof body.state === "object") {
        return (0, state_1.createStatelessState)(body.state);
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
const handleCommand = async (req, res, context) => {
    cleanupExpiredSessions(context);
    const body = await readJson(req);
    const input = typeof body.input === "string" ? body.input : "";
    const state = getStateFromRequest(body, context);
    if (!state) {
        sendJson(res, 400, { error: "Invalid session or state" });
        return;
    }
    const parsed = (0, parser_1.parseArgs)(input);
    if (parsed.length === 0) {
        sendJson(res, 200, {
            output: "",
            state: (0, state_1.toSerializableState)(state),
            cwd: (0, state_1.getCwd)(state),
            exit: false,
            screenMode: (0, aliases_1.getScreenMode)(state),
            prompt: (0, aliases_1.renderPrompt)(state)
        });
        return;
    }
    const [command, ...args] = parsed;
    const result = (0, aliases_1.runCliCommand)(state, command, args);
    let rebootLines = [];
    if (result.reboot) {
        const preservedConfig = { ...state.config };
        const freshState = (0, state_1.createInitialState)();
        freshState.config = preservedConfig;
        // We update the state object in place or replace it if it's from session
        // For stateless, we just return the new state
        const motd = (0, commands_1.dispatchCommand)(freshState, "open", ["/system/motd.txt"]);
        (0, commands_1.dispatchCommand)(freshState, "cd", ["/home"]);
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
            state: (0, state_1.toSerializableState)(freshState),
            cwd: (0, state_1.getCwd)(freshState),
            prompt: (0, aliases_1.renderPrompt)(freshState),
            exit: !!result.exit,
            clear: !!result.clear,
            reboot: true,
            animate: !!result.animate,
            aocMode: !!result.aocMode,
            rebootLines,
            screenMode: (0, aliases_1.getScreenMode)(freshState),
            theme: freshState.config.theme
        });
        return;
    }
    sendJson(res, 200, {
        output: result.output,
        state: (0, state_1.toSerializableState)(state),
        cwd: (0, state_1.getCwd)(state),
        prompt: (0, aliases_1.renderPrompt)(state),
        exit: !!result.exit,
        clear: !!result.clear,
        reboot: !!result.reboot,
        animate: !!result.animate,
        aocMode: !!result.aocMode,
        rebootLines,
        screenMode: result.screenMode ?? (0, aliases_1.getScreenMode)(state),
        theme: result.theme ?? state.config.theme
    });
};
const handleAoc = async (req, res, context) => {
    cleanupExpiredSessions(context);
    const body = await readJson(req);
    const state = getStateFromRequest(body, context);
    if (!state) {
        sendJson(res, 400, { error: "Invalid session or state" });
        return;
    }
    const action = typeof body.action === "string" ? body.action : "list";
    const path = typeof body.path === "string" ? body.path : (0, state_1.getCwd)(state);
    if (action === "list") {
        const dir = (0, path_1.getDirectoryAtPath)(state.root, path);
        if (!dir) {
            sendJson(res, 404, { error: "Not a directory" });
            return;
        }
        const entries = Object.entries(dir.children)
            .map(([name, node]) => ({ name, isDir: node.kind === "dir" }))
            .sort((a, b) => {
            if (a.isDir !== b.isDir)
                return a.isDir ? -1 : 1;
            return a.name.localeCompare(b.name);
        });
        if (path !== "/") {
            entries.unshift({ name: "..", isDir: true });
        }
        sendJson(res, 200, { entries, path, state: (0, state_1.toSerializableState)(state) });
        return;
    }
    if (action === "preview") {
        const itemPath = typeof body.itemPath === "string" ? body.itemPath : path;
        const node = (0, path_1.getNodeAtPath)(state.root, itemPath);
        if (!node) {
            sendJson(res, 404, { error: "Not found" });
            return;
        }
        let preview = "";
        if (node.kind === "dir") {
            preview = (0, commands_1.dispatchCommand)(state, "tree", [itemPath]).output;
        }
        else {
            preview = node.content;
        }
        sendJson(res, 200, { preview, state: (0, state_1.toSerializableState)(state) });
        return;
    }
    sendJson(res, 400, { error: "Unknown action" });
};
const createWebHandler = (options = {}) => {
    const context = {
        sessions: new Map(),
        sessionTtlMs: options.sessionTtlMs ?? DEFAULT_SESSION_TTL_MS,
        now: options.now ?? Date.now
    };
    return async (req, res) => {
        try {
            if (!req.url || !req.method) {
                res.statusCode = 400;
                res.end("Bad request");
                return;
            }
            // Use a dummy base to parse the URL and get the pathname
            const url = new URL(req.url, "http://localhost");
            const { pathname } = url;
            if (req.method === "GET" && pathname === "/") {
                res.statusCode = 200;
                res.setHeader("content-type", "text/html; charset=utf-8");
                res.end((0, renderPage_1.renderWebPage)());
                return;
            }
            if (req.method === "GET" && pathname === "/health") {
                handleHealth(res, context);
                return;
            }
            if (req.method === "POST" && pathname === "/api/init") {
                handleInit(res, context);
                return;
            }
            if (req.method === "POST" && pathname === "/api/command") {
                await handleCommand(req, res, context);
                return;
            }
            if (req.method === "POST" && pathname === "/api/aoc") {
                await handleAoc(req, res, context);
                return;
            }
            res.statusCode = 404;
            res.end("Not found");
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            sendJson(res, 500, { error: message });
        }
    };
};
exports.createWebHandler = createWebHandler;
