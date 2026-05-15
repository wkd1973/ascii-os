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
    actions.push({ type: "reboot", lines: response.rebootLines });
  }

  if (response.aocMode) {
    actions.push({ type: "aocMode" });
  }

  if (response.screenMode) {
    actions.push({ type: "screenMode", mode: response.screenMode });
  }

  if (response.theme) {
    actions.push({ type: "theme", theme: response.theme });
  }

  if (response.output) {
    const action = shouldRenderHelpPanel(command)
      ? { type: "appendHelp", text: response.output }
      : { type: "append", text: response.output };

    if (action.type === "append" && response.animate) {
      action.animate = true;
    }
    actions.push(action);
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

let isAocMode = false;
let aocItems = [];
let aocSelectedIndex = 0;
let aocCurrentPath = "/";
let aocActivePane = "left";

const cliView = document.getElementById("cli-view");
const aocView = document.getElementById("aoc-view");
const aocList = document.getElementById("aoc-list");
const aocPreview = document.getElementById("aoc-preview");
const aocLeftPane = document.getElementById("aoc-left");
const aocRightPane = document.getElementById("aoc-right");
const aocLeftTitle = document.querySelector("#aoc-left .aoc-title");
const cliFoot = document.getElementById("cli-foot");
const aocFoot = document.getElementById("aoc-foot");

let audioCtx = null;
const initAudio = () => {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
};

const playBeep = (freq = 440, duration = 0.1, type = "square") => {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
};

const playDiskCrunch = async () => {
  if (!audioCtx) return;
  for (let i = 0; i < 3; i++) {
    const duration = 0.2;
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let j = 0; j < bufferSize; j++) {
       data[j] = (Math.random() * 2 - 1) * 0.2;
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(400, audioCtx.currentTime);
    noise.connect(filter);
    filter.connect(audioCtx.destination);
    noise.start();
    await new Promise(r => setTimeout(r, 300));
  }
};

const initTouch = () => {
  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  if (isTouch) {
    document.body.classList.add("is-touch");
  }

  const handleAction = (key) => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key }));
  };

  document.getElementById("t-up").onclick = () => handleAction("ArrowUp");
  document.getElementById("t-dn").onclick = () => handleAction("ArrowDown");
  document.getElementById("t-tab").onclick = () => handleAction("Tab");
  document.getElementById("t-ent").onclick = () => handleAction("Enter");
  document.getElementById("t-esc").onclick = () => {
     if (isAocMode) exitAocMode();
  };
};

const updateAocActivePane = () => {
  if (aocActivePane === "left") {
    aocLeftPane.classList.add("active");
    aocRightPane.classList.remove("active");
  } else {
    aocLeftPane.classList.remove("active");
    aocRightPane.classList.add("active");
  }
};

const fetchAocList = async (path, selectName) => {
  if (path) {
    await post("/api/command", { sessionId, input: "cd " + path });
  }
  const data = await post("/api/aoc", { sessionId, action: "list" });
  aocItems = data.entries;
  aocCurrentPath = data.path;
  if (aocLeftTitle) {
    aocLeftTitle.textContent = aocCurrentPath;
  }
  
  if (selectName) {
    const index = aocItems.findIndex(item => item.name === selectName);
    aocSelectedIndex = index >= 0 ? index : 0;
  } else {
    aocSelectedIndex = 0;
  }

  renderAocList();
  fetchAocPreview();
};

const renderMarkdown = (text) => {
  if (!text) return "";
  const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lines = text.split(/\\r?\\n/);
  let html = "";
  let inList = false;

  for (let line of lines) {
    const trimmed = line.trim();
    
    // Headers (h1-h3)
    const hMatch = trimmed.match(/^(#{1,3})\\s+(.*)$/);
    if (hMatch) {
      if (inList) { html += "</ul>"; inList = false; }
      const level = hMatch[1].length;
      html += "<h" + level + ">" + escape(hMatch[2]) + "</h" + level + ">";
      continue;
    }

    // Lists (- or *)
    const lMatch = line.match(/^(\\s*)[-*]\\s+(.*)$/);
    if (lMatch) {
      if (!inList) { html += "<ul>"; inList = true; }
      const content = escape(lMatch[2]).replace(/\\*\\*(.*?)\\*\\*/g, "<strong>$1</strong>");
      html += "<li>" + content + "</li>";
      continue;
    }

    if (trimmed === "") {
      if (inList) { html += "</ul>"; inList = false; }
      html += "<br>";
      continue;
    }

    if (inList) {
      html += "</ul>";
      inList = false;
    }

    const processedLine = escape(line).replace(/\\*\\*(.*?)\\*\\*/g, "<strong>$1</strong>");
    html += "<div>" + processedLine + "</div>";
  }

  if (inList) html += "</ul>";
  return html;
};

const fetchAocPreview = async () => {
  const item = aocItems[aocSelectedIndex];
  if (!item) {
    aocPreview.innerHTML = "";
    return;
  }
  
  let itemPath = aocCurrentPath === "/" ? "/" + item.name : aocCurrentPath + "/" + item.name;
  if (item.name === "..") {
    const parts = aocCurrentPath.split("/").filter(Boolean);
    parts.pop();
    itemPath = "/" + parts.join("/");
  }

  const data = await post("/api/aoc", { sessionId, action: "preview", itemPath });
  
  if (item.isDir || item.name.endsWith(".txt") || item.name.endsWith(".md")) {
    aocPreview.innerHTML = renderMarkdown(data.preview);
  } else {
    aocPreview.textContent = data.preview;
  }
  
  aocPreview.scrollTop = 0;
};

const renderAocList = () => {
  aocList.replaceChildren();
  aocItems.forEach((item, index) => {
    const el = document.createElement("div");
    el.className = "aoc-item" + (index === aocSelectedIndex ? " selected" : "") + (item.isDir ? " aoc-dir" : "");
    el.textContent = item.isDir ? "[" + item.name + "]" : item.name;
    el.onclick = () => {
       aocSelectedIndex = index;
       renderAocList();
       fetchAocPreview();
    };
    el.ondblclick = () => {
       aocEnterItem(index);
    };
    aocList.appendChild(el);
  });
  const selectedEl = aocList.children[aocSelectedIndex];
  if (selectedEl) {
    selectedEl.scrollIntoView({ block: "nearest" });
  }
};

const aocEnterItem = (index) => {
  const item = aocItems[index];
  if (item && item.isDir) {
    if (item.name === "..") {
      const parts = aocCurrentPath.split("/").filter(Boolean);
      const exitedDir = parts.pop();
      const nextPath = "/" + parts.join("/");
      fetchAocList(nextPath, exitedDir);
    } else {
      let nextPath = aocCurrentPath === "/" ? "/" + item.name : aocCurrentPath + "/" + item.name;
      fetchAocList(nextPath);
    }
  }
};

const enterAocMode = async () => {
  isAocMode = true;
  aocActivePane = "left";
  updateAocActivePane();
  cliView.style.display = "none";
  cliFoot.style.display = "none";
  aocView.style.display = "flex";
  aocFoot.style.display = "flex";
  await fetchAocList(null);
};

const exitAocMode = () => {
  isAocMode = false;
  aocView.style.display = "none";
  aocFoot.style.display = "none";
  cliView.style.display = "flex";
  cliFoot.style.display = "flex";
  input.focus();
};

const scrollToBottom = () => {
  setTimeout(() => {
    // Scroll the input into view of its closest scrollable ancestor (#screen)
    // block: "nearest" ensures it just brings it into view without unnecessary jumping
    input.scrollIntoView({ block: "nearest", behavior: "auto" });
    // Fallback to absolute scroll height if needed
    screen.scrollTop = screen.scrollHeight;
  }, 50);
};

const appendBlock = (text) => {
  const block = document.createElement("div");
  block.className = "output-block";
  block.textContent = text;
  out.appendChild(block);
  scrollToBottom();
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
  scrollToBottom();
};

const clearOutput = () => {
  out.replaceChildren();
  screen.scrollTop = 0;
};

const setScreenMode = (mode) => {
  document.body.classList.remove("mode-cga", "mode-ega", "mode-vga");
  document.body.classList.add(getScreenModeClass(mode));
};

const setTheme = (theme) => {
  document.body.classList.remove("theme-pearl", "theme-bw", "theme-blue", "theme-amber", "theme-green");
  if (theme !== "default") {
    document.body.classList.add("theme-" + theme);
  }
};

const setPrompt = (text) => {
  promptEl.textContent = text;
};

const initSysStats = () => {
  const clockEl = document.getElementById("sys-clock");
  const ramEl = document.getElementById("sys-ram");

  const updateClock = () => {
    const now = new Date();
    clockEl.textContent = now.toTimeString().split(" ")[0];
  };

  const updateRam = () => {
    const base = 580;
    const vari = Math.floor(Math.random() * 20);
    ramEl.textContent = (base + vari) + "K / 640K OK";
  };

  updateClock();
  updateRam();
  setInterval(updateClock, 1000);
  setInterval(updateRam, 5000);
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

const appendBootLines = async (lines, fast = false) => {
  input.disabled = true;
  for (const line of lines) {
    appendBlock(line);
    let delay = fast ? Math.random() * 50 + 20 : Math.random() * 150 + 100;
    
    if (!fast) {
      if (line.includes("MEMORY TEST")) {
        delay = 800;
      } else if (line.includes("LOADING")) {
        delay = 400;
      } else if (line.trim() === "") {
        delay = 300;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  appendBlock("");
  input.disabled = false;
  input.focus();
};

const restoreSession = async (storedSession) => {
  const data = await post("/api/command", { sessionId: storedSession.sessionId, input: "" });
  sessionId = storedSession.sessionId;
  commandHistory.splice(0, commandHistory.length, ...storedSession.history);
  historyIndex = commandHistory.length;
  if (data.screenMode) {
    setScreenMode(data.screenMode);
  }
  if (data.theme) {
    setTheme(data.theme);
  }
  setPrompt(data.prompt);
  await appendBootLines(["RESTORED ASCII-OS WEB SESSION...", "", "WELCOME BACK, OPERATOR"]);
  writeStoredSession(sessionId, commandHistory);
};

const startFreshSession = async () => {
  const data = await post("/api/init");
  sessionId = data.sessionId;
  commandHistory.splice(0, commandHistory.length);
  historyIndex = 0;
  if (data.screenMode) {
    setScreenMode(data.screenMode);
  }
  if (data.theme) {
    setTheme(data.theme);
  }
  setPrompt(data.prompt);
  await appendBootLines(data.lines);
  writeStoredSession(sessionId, commandHistory);
  await execCommand("aoc");
};

const boot = async () => {
  console.log("ASCII-OS CLIENT v1.0.7 BOOTING...");
  initSysStats();
  initTouch();
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

const execCommand = async (command) => {
  if (!command.trim() || input.disabled) {
    return;
  }
  initAudio();
  playBeep(600, 0.05);
  commandHistory.push(command);
  historyIndex = commandHistory.length;
  appendBlock(promptEl.textContent + command);
  writeStoredSession(sessionId, commandHistory);
  input.value = "";
  scrollToBottom();
  
  try {
    const data = await post("/api/command", { sessionId, input: command });
    for (const action of planCommandResponseRender(command, data)) {
      if (action.type === "clear") {
        clearOutput();
      }
      if (action.type === "reboot") {
        await appendBootLines(action.lines);
        await execCommand("aoc");
      }
      if (action.type === "append") {
        if (action.animate) {
          await appendBootLines(action.text.split("\\n"), true);
        } else {
          appendBlock(action.text);
        }
      }
      if (action.type === "appendHelp") {
        renderHelpPanel(action.text);
      }
      if (action.type === "screenMode") {
        setScreenMode(action.mode);
      }
      if (action.type === "theme") {
        setTheme(action.theme);
      }
      if (action.type === "aocMode") {
        await enterAocMode();
      }
      if (action.type === "prompt") {
        setPrompt(action.text);
      }
      if (action.type === "disableInput") {
        input.disabled = true;
      }
    }
    scrollToBottom();
  } catch (err) {
    appendBlock("Error: " + err.message);
  }
};

const fKey = (num) => {
  if (isAocMode) {
    if (num === 0) {
      exitAocMode();
    }
    // Other AOC shortcuts can be added here
    return;
  }
  const map = {
    1: "help",
    2: "home",
    3: "projects",
    4: "about",
    5: "cv",
    6: "guide",
    7: "mode",
    8: "cls",
    9: "reboot",
    0: "exit"
  };
  const command = map[num];
  if (command) {
    execCommand(command);
  }
};
window.fKey = fKey;

window.addEventListener("keydown", (e) => {
  if (isAocMode) {
    if (e.key === "Tab") {
      e.preventDefault();
      aocActivePane = aocActivePane === "left" ? "right" : "left";
      updateAocActivePane();
      return;
    }

    if (aocActivePane === "left") {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        aocSelectedIndex = Math.max(0, aocSelectedIndex - 1);
        renderAocList();
        fetchAocPreview();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        aocSelectedIndex = Math.min(aocItems.length - 1, aocSelectedIndex + 1);
        renderAocList();
        fetchAocPreview();
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        aocEnterItem(aocSelectedIndex);
        return;
      }
    } else {
      // Right pane scrolling
      if (e.key === "ArrowUp") { e.preventDefault(); aocPreview.scrollTop -= 20; return; }
      if (e.key === "ArrowDown") { e.preventDefault(); aocPreview.scrollTop += 20; return; }
      if (e.key === "ArrowLeft") { e.preventDefault(); aocPreview.scrollLeft -= 20; return; }
      if (e.key === "ArrowRight") { e.preventDefault(); aocPreview.scrollLeft += 20; return; }
    }
  }

  if (e.altKey && e.key >= "0" && e.key <= "9") {
    e.preventDefault();
    fKey(parseInt(e.key, 10));
  }
});

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

form.addEventListener("submit", (e) => {
  e.preventDefault();
  execCommand(input.value);
});

boot().catch((err) => {
  appendBlock("Fatal error: " + err.message);
});
`;
