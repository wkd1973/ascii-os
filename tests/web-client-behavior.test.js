const test = require("node:test");
const assert = require("node:assert/strict");

const {
  addCommandToHistory,
  createCommandHistory,
  getScreenModeClass,
  navigateCommandHistory,
  planCommandResponseRender,
  parseStoredWebSession,
  serializeStoredWebSession,
  shouldRenderHelpPanel
} = require("../build/web/clientBehavior.js");

test("web client history navigates up and down like a terminal", () => {
  let history = createCommandHistory();
  history = addCommandToHistory(history, "help");
  history = addCommandToHistory(history, "projects");
  history = addCommandToHistory(history, "project ascii-os");

  const firstUp = navigateCommandHistory(history, "up");
  assert.equal(firstUp.value, "project ascii-os");

  const secondUp = navigateCommandHistory(firstUp.state, "up");
  assert.equal(secondUp.value, "projects");

  const thirdUp = navigateCommandHistory(secondUp.state, "up");
  assert.equal(thirdUp.value, "help");

  const clampedUp = navigateCommandHistory(thirdUp.state, "up");
  assert.equal(clampedUp.value, "help");

  const firstDown = navigateCommandHistory(clampedUp.state, "down");
  assert.equal(firstDown.value, "projects");

  const secondDown = navigateCommandHistory(firstDown.state, "down");
  assert.equal(secondDown.value, "project ascii-os");

  const emptyInput = navigateCommandHistory(secondDown.state, "down");
  assert.equal(emptyInput.value, "");
});

test("web client maps screen modes to body classes", () => {
  assert.equal(getScreenModeClass("cga"), "mode-cga");
  assert.equal(getScreenModeClass("ega"), "mode-ega");
  assert.equal(getScreenModeClass("vga"), "mode-vga");
  assert.equal(getScreenModeClass("unknown"), "mode-cga");
});

test("web client detects help commands for panel rendering", () => {
  assert.equal(shouldRenderHelpPanel("help"), true);
  assert.equal(shouldRenderHelpPanel(" HELP "), true);
  assert.equal(shouldRenderHelpPanel("projects"), false);
});

test("web client serializes and parses stored sessions", () => {
  const raw = serializeStoredWebSession("session-1", ["help", "projects"]);
  assert.equal(raw, JSON.stringify({ version: 1, sessionId: "session-1", history: ["help", "projects"] }));

  assert.deepEqual(parseStoredWebSession(raw), {
    sessionId: "session-1",
    history: ["help", "projects"]
  });

  assert.equal(parseStoredWebSession(null), null);
  assert.equal(parseStoredWebSession("not-json"), null);
  assert.equal(parseStoredWebSession(JSON.stringify({ version: 2, sessionId: "x", history: [] })), null);
});

test("web client plans clear response rendering", () => {
  assert.deepEqual(
    planCommandResponseRender("clear", {
      clear: true,
      prompt: "ascii-os:[/home]> "
    }),
    [
      { type: "clear" },
      { type: "prompt", text: "ascii-os:[/home]> " }
    ]
  );
});

test("web client plans reboot response rendering", () => {
  assert.deepEqual(
    planCommandResponseRender("reboot", {
      clear: true,
      reboot: true,
      rebootLines: ["REBOOTING ASCII-OS WEB...", "WELCOME, OPERATOR"],
      screenMode: "vga",
      prompt: "[/home]>"
    }),
    [
      { type: "clear" },
      { type: "append", text: "REBOOTING ASCII-OS WEB..." },
      { type: "append", text: "WELCOME, OPERATOR" },
      { type: "append", text: "" },
      { type: "screenMode", mode: "vga" },
      { type: "prompt", text: "[/home]>" }
    ]
  );
});

test("web client plans help, regular output, mode, prompt and exit rendering", () => {
  assert.deepEqual(
    planCommandResponseRender("help", {
      output: "Core filesystem commands:",
      prompt: "ascii-os:[/home]> "
    }),
    [
      { type: "appendHelp", text: "Core filesystem commands:" },
      { type: "append", text: "" },
      { type: "prompt", text: "ascii-os:[/home]> " }
    ]
  );

  assert.deepEqual(
    planCommandResponseRender("shutdown", {
      output: "SYSTEM HALTED.",
      screenMode: "ega",
      prompt: "ascii-os:[/home]> ",
      exit: true
    }),
    [
      { type: "screenMode", mode: "ega" },
      { type: "append", text: "SYSTEM HALTED." },
      { type: "append", text: "" },
      { type: "prompt", text: "ascii-os:[/home]> " },
      { type: "disableInput" }
    ]
  );
});
