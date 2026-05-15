"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWebServer = void 0;
const node_http_1 = require("node:http");
const node_crypto_1 = require("node:crypto");
const aliases_1 = require("../cli/aliases");
const parser_1 = require("../engine/parser");
const commands_1 = require("../engine/commands");
const path_1 = require("../engine/path");
const state_1 = require("../engine/state");
const renderPage_1 = require("./renderPage");
const PORT = Number(process.env.PORT ?? "3000");
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
    // eslint-disable-next-line no-console
    console.log(`[INIT] Sending BIOS version: ${version}`);
    (0, commands_1.dispatchCommand)(state, "cd", ["/home"]);
    sendJson(res, 200, {
        sessionId,
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
const handleCommand = async (req, res, context) => {
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
    const parsed = (0, parser_1.parseArgs)(input);
    if (parsed.length === 0) {
        sendJson(res, 200, {
            output: "",
            cwd: (0, state_1.getCwd)(session.state),
            exit: false,
            screenMode: (0, aliases_1.getScreenMode)(session.state),
            prompt: (0, aliases_1.renderPrompt)(session.state)
        });
        return;
    }
    const [command, ...args] = parsed;
    const result = (0, aliases_1.runCliCommand)(session.state, command, args);
    let rebootLines = [];
    if (result.reboot) {
        const preservedConfig = { ...session.state.config };
        const freshState = (0, state_1.createInitialState)();
        freshState.config = preservedConfig;
        session.state = freshState;
        const motd = (0, commands_1.dispatchCommand)(freshState, "open", ["/system/motd.txt"]);
        (0, commands_1.dispatchCommand)(freshState, "cd", ["/home"]);
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
    }
    sendJson(res, 200, {
        output: result.output,
        cwd: (0, state_1.getCwd)(session.state),
        prompt: (0, aliases_1.renderPrompt)(session.state),
        exit: result.exit === true,
        clear: result.clear === true,
        reboot: result.reboot === true,
        animate: result.animate === true,
        aocMode: result.aocMode === true,
        rebootLines,
        screenMode: result.screenMode ?? (result.reboot ? (0, aliases_1.getScreenMode)(session.state) : null),
        theme: result.theme ?? (result.reboot ? session.state.config.theme : null)
    });
};
const handleAoc = async (req, res, context) => {
    cleanupExpiredSessions(context);
    const body = await readJson(req);
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
    const session = context.sessions.get(sessionId);
    if (!session) {
        sendJson(res, 400, { error: "Invalid session" });
        return;
    }
    touchSession(session, context.now);
    const action = typeof body.action === "string" ? body.action : "list";
    const path = typeof body.path === "string" ? body.path : (0, state_1.getCwd)(session.state);
    if (action === "list") {
        const dir = (0, path_1.getDirectoryAtPath)(session.state.root, path);
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
        sendJson(res, 200, { entries, path });
        return;
    }
    if (action === "preview") {
        const itemPath = typeof body.itemPath === "string" ? body.itemPath : path;
        const node = (0, path_1.getNodeAtPath)(session.state.root, itemPath);
        if (!node) {
            sendJson(res, 404, { error: "Not found" });
            return;
        }
        let preview = "";
        if (node.kind === "dir") {
            preview = (0, commands_1.dispatchCommand)(session.state, "tree", [itemPath]).output;
        }
        else {
            preview = node.content;
        }
        sendJson(res, 200, { preview });
        return;
    }
    sendJson(res, 400, { error: "Unknown action" });
};
const createWebServer = (options = {}) => {
    const context = {
        sessions: new Map(),
        sessionTtlMs: options.sessionTtlMs ?? DEFAULT_SESSION_TTL_MS,
        now: options.now ?? Date.now
    };
    return (0, node_http_1.createServer)(async (req, res) => {
        try {
            if (!req.url || !req.method) {
                res.statusCode = 400;
                res.end("Bad request");
                return;
            }
            if (req.method === "GET" && req.url === "/") {
                res.statusCode = 200;
                res.setHeader("content-type", "text/html; charset=utf-8");
                res.end((0, renderPage_1.renderWebPage)());
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
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            sendJson(res, 500, { error: message });
        }
    });
};
exports.createWebServer = createWebServer;
if (require.main === module) {
    const server = (0, exports.createWebServer)();
    server.listen(PORT, () => {
        // eslint-disable-next-line no-console
        console.log("========================================");
        // eslint-disable-next-line no-console
        console.log(`ASCII-OS WEB SERVER STARTING ON PORT ${PORT}`);
        // eslint-disable-next-line no-console
        console.log("VFS TELEMETRY ENABLED");
        // eslint-disable-next-line no-console
        console.log("========================================");
    });
}
