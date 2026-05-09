"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientScript = void 0;
const clientBehaviorScript = `
const getScreenModeClass = (mode) => {
  if (mode === "ega") {
    return "mode-ega";
  }
  if (mode === "vga") {
    return "mode-vga";
  }
  return "mode-cga";
};
const shouldRenderHelpPanel = (command) => command.trim().toLowerCase() === "help";
const storageKey = "ascii-os:web-session";
const serializeStoredWebSession = (sessionId, history) => JSON.stringify({
  version: 1,
  sessionId,
  history
});
const parseStoredWebSession = (raw) => {
  if (!raw) {
    return null;
  }

  try {
    const data = JSON.parse(raw);
    if (data.version !== 1) {
      return null;
    }

    const sessionId = typeof data.sessionId === "string" ? data.sessionId : "";
    const history = Array.isArray(data.history) ? data.history.filter((entry) => typeof entry === "string") : [];
    if (!sessionId) {
      return null;
    }

    return { sessionId, history };
  } catch {
    return null;
  }
};
const readStoredSession = () => {
  try {
    return parseStoredWebSession(window.localStorage.getItem(storageKey));
  } catch {
    return null;
  }
};
const writeStoredSession = (sessionId, history) => {
  try {
    window.localStorage.setItem(storageKey, serializeStoredWebSession(sessionId, history));
  } catch {
  }
};
const clearStoredSession = () => {
  try {
    window.localStorage.removeItem(storageKey);
  } catch {
  }
};
const planCommandResponseRender = (command, response) => {
  const actions = [];

  if (response.clear) {
    actions.push({ type: "clear" });
  }

  if (response.reboot && Array.isArray(response.rebootLines)) {
    for (const line of response.rebootLines) {
      actions.push({ type: "append", text: line });
    }
    actions.push({ type: "append", text: "" });
  }

  if (response.screenMode) {
    actions.push({ type: "screenMode", mode: response.screenMode });
  }

  if (response.output) {
    actions.push(
      shouldRenderHelpPanel(command)
        ? { type: "appendHelp", text: response.output }
        : { type: "append", text: response.output }
    );
  }

  if (!response.clear) {
    actions.push({ type: "append", text: "" });
  }

  if (typeof response.prompt === "string") {
    actions.push({ type: "prompt", text: response.prompt });
  }

  if (response.exit) {
    actions.push({ type: "disableInput" });
  }

  return actions;
};
`;
exports.clientScript = `
${clientBehaviorScript}

let sessionId = null;
const commandHistory = [];
let historyIndex = 0;
const screen = document.getElementById("screen");
const out = document.getElementById("out");
const promptEl = document.getElementById("prompt");
const input = document.getElementById("in");
const form = document.getElementById("form");

const appendBlock = (text) => {
  const block = document.createElement("div");
  block.className = "output-block";
  block.textContent = text;
  out.appendChild(block);
  screen.scrollTop = screen.scrollHeight;
};

const renderHelpPanel = (text) => {
  const lines = text.split("\\n");
  const panel = document.createElement("div");
  panel.className = "help-panel";

  const title = document.createElement("div");
  title.className = "help-title";
  title.textContent = "COMMAND REFERENCE";
  panel.appendChild(title);

  let currentSection = null;
  let currentGrid = null;

  const flushSection = () => {
    if (!currentSection || !currentGrid) {
      return;
    }
    panel.appendChild(currentSection);
    currentSection = null;
    currentGrid = null;
  };

  for (const line of lines) {
    if (!line.trim()) {
      continue;
    }

    if (line.endsWith(":")) {
      flushSection();
      currentSection = document.createElement("div");
      currentSection.className = "help-section";
      const heading = document.createElement("div");
      heading.className = "help-section-title";
      heading.textContent = line.slice(0, -1);
      currentSection.appendChild(heading);
      currentGrid = document.createElement("div");
      currentGrid.className = "help-grid";
      currentSection.appendChild(currentGrid);
      continue;
    }

    if (!currentGrid) {
      currentSection = document.createElement("div");
      currentSection.className = "help-section";
      currentGrid = document.createElement("div");
      currentGrid.className = "help-grid";
      currentSection.appendChild(currentGrid);
    }

    const match = line.match(/^  (.+?)(?:\\s{2,})(.+)$/);
    if (match) {
      const command = document.createElement("div");
      command.className = "help-command";
      command.textContent = match[1].trimEnd();
      const desc = document.createElement("div");
      desc.className = "help-desc";
      desc.textContent = match[2].trim();
      currentGrid.appendChild(command);
      currentGrid.appendChild(desc);
      continue;
    }

    const note = document.createElement("div");
    note.className = "help-desc help-note";
    note.textContent = line;
    currentGrid.appendChild(note);
  }

  flushSection();
  out.appendChild(panel);
  screen.scrollTop = screen.scrollHeight;
};

const clearOutput = () => {
  out.replaceChildren();
  screen.scrollTop = 0;
};

const setScreenMode = (mode) => {
  document.body.classList.remove("mode-cga", "mode-ega", "mode-vga");
  document.body.classList.add(getScreenModeClass(mode));
};

const setPrompt = (text) => {
  promptEl.textContent = text;
};

const post = async (url, payload) => {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {})
  });
  if (!res.ok) {
    throw new Error("HTTP " + res.status);
  }
  return res.json();
};

const appendBootLines = (lines) => {
  for (const line of lines) {
    appendBlock(line);
  }
  appendBlock("");
};

const restoreSession = async (storedSession) => {
  const data = await post("/api/command", { sessionId: storedSession.sessionId, input: "" });
  sessionId = storedSession.sessionId;
  commandHistory.splice(0, commandHistory.length, ...storedSession.history);
  historyIndex = commandHistory.length;
  if (data.screenMode) {
    setScreenMode(data.screenMode);
  }
  setPrompt(data.prompt);
  appendBootLines(["RESTORED ASCII-OS WEB SESSION...", "", "WELCOME BACK, OPERATOR"]);
  input.focus();
};

const startFreshSession = async () => {
  const data = await post("/api/init");
  sessionId = data.sessionId;
  commandHistory.splice(0, commandHistory.length);
  historyIndex = 0;
  if (data.screenMode) {
    setScreenMode(data.screenMode);
  }
  setPrompt(data.prompt);
  appendBootLines(data.lines);
  writeStoredSession(sessionId, commandHistory);
  input.focus();
};

const boot = async () => {
  const storedSession = readStoredSession();
  if (storedSession) {
    try {
      await restoreSession(storedSession);
      return;
    } catch {
      clearStoredSession();
    }
  }

  await startFreshSession();
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
  if (!command.trim()) {
    return;
  }
  commandHistory.push(command);
  historyIndex = commandHistory.length;
  appendBlock(promptEl.textContent + command);
  writeStoredSession(sessionId, commandHistory);
  input.value = "";
  screen.scrollTop = screen.scrollHeight;
  const data = await post("/api/command", { sessionId, input: command });
  for (const action of planCommandResponseRender(command, data)) {
    if (action.type === "clear") {
      clearOutput();
    }
    if (action.type === "append") {
      appendBlock(action.text);
    }
    if (action.type === "appendHelp") {
      renderHelpPanel(action.text);
    }
    if (action.type === "screenMode") {
      setScreenMode(action.mode);
    }
    if (action.type === "prompt") {
      setPrompt(action.text);
    }
    if (action.type === "disableInput") {
      input.disabled = true;
    }
  }
  screen.scrollTop = screen.scrollHeight;
});

boot().catch((err) => {
  appendBlock("Fatal error: " + err.message);
});
`;
