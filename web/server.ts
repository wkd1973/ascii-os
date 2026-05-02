import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { getScreenMode, runCliCommand, setScreenMode } from "../cli/aliases";
import { parseArgs } from "../cli/parser";
import { dispatchCommand } from "../engine/commands";
import { createInitialState, getCwd, type SystemState } from "../engine/state";

type Session = {
  state: SystemState;
};

const sessions = new Map<string, Session>();
const PORT = Number(process.env.PORT ?? "3000");

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ascii-os web</title>
  <style>
    :root { --bg:#0b0f0b; --fg:#c7f9cc; --muted:#6b8f71; --accent:#80ed99; --lh:1.2em; --rows:25; }
    body { margin:0; min-height:100dvh; overflow:hidden; display:grid; place-items:center; background:radial-gradient(circle at 20% 20%, #132a13 0%, var(--bg) 55%); color:var(--fg); font:16px/var(--lh) "Courier New", monospace; }
    .wrap { width:82ch; border:1px solid #2d6a4f; box-shadow:0 0 0 1px #1b4332 inset; display:flex; flex-direction:column; box-sizing:border-box; background:#081c15; }
    .head { padding:10px 12px; background:#081c15; color:var(--accent); border-bottom:1px solid #2d6a4f; }
    .term { display:flex; flex-direction:column; flex:1; min-height:0; }
    #screen { padding:0 1ch; width:80ch; height:calc(var(--rows) * var(--lh)); overflow:auto; box-sizing:border-box; }
    #screen { scrollbar-width: thin; scrollbar-color: #2d6a4f #081c15; }
    #screen::-webkit-scrollbar { width: 10px; }
    #screen::-webkit-scrollbar-track { background: #081c15; }
    #screen::-webkit-scrollbar-thumb { background: #2d6a4f; border: 1px solid #1b4332; border-radius: 0; }
    #screen::-webkit-scrollbar-thumb:hover { background: #40916c; }
    body.mode-cga { --rows:25; }
    body.mode-ega { --rows:43; }
    body.mode-vga { --rows:50; }
    #out { margin:0; white-space:pre-wrap; }
    .row { display:flex; gap:0; align-items:center; margin-top:2px; }
    #in { flex:1; background:transparent; color:var(--fg); border:0; outline:0; padding:0; font:inherit; }
    .muted { color:var(--muted); }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="head">ascii-os:web</div>
    <div class="term">
      <div id="screen">
        <pre id="out"></pre>
        <form class="row" id="form">
          <span class="muted" id="prompt">ascii-os:[/]> </span>
          <input id="in" autocomplete="off" />
        </form>
      </div>
    </div>
  </div>
  <script>
    let sessionId = null;
    const commandHistory = [];
    let historyIndex = 0;
    const screen = document.getElementById("screen");
    const out = document.getElementById("out");
    const promptEl = document.getElementById("prompt");
    const input = document.getElementById("in");
    const form = document.getElementById("form");

    const print = (text) => {
      out.textContent += text + "\\n";
      screen.scrollTop = screen.scrollHeight;
    };
    const clearOutput = () => {
      out.textContent = "";
      screen.scrollTop = 0;
    };
    const setScreenMode = (mode) => {
      document.body.classList.remove("mode-cga", "mode-ega", "mode-vga");
      if (mode === "ega") {
        document.body.classList.add("mode-ega");
        return;
      }
      if (mode === "vga") {
        document.body.classList.add("mode-vga");
        return;
      }
      document.body.classList.add("mode-cga");
    };

    const setPrompt = (cwd) => { promptEl.textContent = "ascii-os:[" + cwd + "]> "; };

    const post = async (url, payload) => {
      const res = await fetch(url, { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify(payload || {}) });
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    };

    const boot = async () => {
      const data = await post("/api/init");
      sessionId = data.sessionId;
      if (data.screenMode) {
        setScreenMode(data.screenMode);
      }
      for (const line of data.lines) print(line);
      print("");
      setPrompt(data.cwd);
      input.focus();
    };

    input.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") {
        return;
      }

      if (commandHistory.length === 0) {
        return;
      }

      e.preventDefault();

      if (e.key === "ArrowUp") {
        historyIndex = Math.max(0, historyIndex - 1);
      } else {
        historyIndex = Math.min(commandHistory.length, historyIndex + 1);
      }

      input.value = historyIndex === commandHistory.length ? "" : commandHistory[historyIndex];
      input.setSelectionRange(input.value.length, input.value.length);
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const command = input.value;
      if (!command.trim()) return;
      commandHistory.push(command);
      historyIndex = commandHistory.length;
      print(promptEl.textContent + command);
      input.value = "";
      screen.scrollTop = screen.scrollHeight;
      const data = await post("/api/command", { sessionId, input: command });
      if (data.clear) {
        clearOutput();
      }
      if (data.reboot && Array.isArray(data.rebootLines)) {
        for (const line of data.rebootLines) print(line);
        print("");
      }
      if (data.screenMode) {
        setScreenMode(data.screenMode);
      }
      if (data.output) print(data.output);
      if (!data.clear) print("");
      setPrompt(data.cwd);
      screen.scrollTop = screen.scrollHeight;
      if (data.exit) {
        input.disabled = true;
      }
    });

    boot().catch((err) => { print("Fatal error: " + err.message); });
  </script>
</body>
</html>`;

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

const handleInit = (res: ServerResponse): void => {
  const state = createInitialState();
  const sessionId = randomUUID();
  setScreenMode(state, "cga");
  sessions.set(sessionId, { state });

  const motd = dispatchCommand(state, "open", ["/system/motd.txt"]);
  dispatchCommand(state, "cd", ["/home"]);

  sendJson(res, 200, {
    sessionId,
    cwd: getCwd(state),
    screenMode: getScreenMode(state),
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

const handleCommand = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
  const body = await readJson(req);
  const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
  const input = typeof body.input === "string" ? body.input : "";
  const session = sessions.get(sessionId);
  if (!session) {
    sendJson(res, 400, { error: "Invalid session" });
    return;
  }

  const parsed = parseArgs(input);
  if (parsed.length === 0) {
    sendJson(res, 200, { output: "", cwd: getCwd(session.state), exit: false, screenMode: null });
    return;
  }

  const [command, ...args] = parsed;
  const result = runCliCommand(session.state, command, args);
  let rebootLines: string[] = [];

  if (result.reboot) {
    const preservedMode = getScreenMode(session.state);
    const freshState = createInitialState();
    setScreenMode(freshState, preservedMode);
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
    exit: result.exit === true,
    clear: result.clear === true,
    reboot: result.reboot === true,
    rebootLines,
    screenMode: result.screenMode ?? (result.reboot ? getScreenMode(session.state) : null)
  });
};

export const createWebServer = () =>
  createServer(async (req, res) => {
  try {
    if (!req.url || !req.method) {
      res.statusCode = 400;
      res.end("Bad request");
      return;
    }

    if (req.method === "GET" && req.url === "/") {
      res.statusCode = 200;
      res.setHeader("content-type", "text/html; charset=utf-8");
      res.end(html);
      return;
    }

    if (req.method === "POST" && req.url === "/api/init") {
      handleInit(res);
      return;
    }

    if (req.method === "POST" && req.url === "/api/command") {
      await handleCommand(req, res);
      return;
    }

    res.statusCode = 404;
    res.end("Not found");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    sendJson(res, 500, { error: message });
  }
});

if (require.main === module) {
  const server = createWebServer();
  server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`ascii-os web listening on http://localhost:${PORT}`);
  });
}
