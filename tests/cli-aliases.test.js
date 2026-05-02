const test = require("node:test");
const assert = require("node:assert/strict");

const { createInitialState, getCwd } = require("../build/engine/state.js");
const { getScreenMode, runCliCommand } = require("../build/cli/aliases.js");

test("home alias moves to /home", () => {
  const state = createInitialState();

  const result = runCliCommand(state, "home", []);

  assert.equal(result.output, "");
  assert.equal(getCwd(state), "/home");
});

test("projects alias moves to /projects and returns formatted listing", () => {
  const state = createInitialState();

  const result = runCliCommand(state, "projects", []);

  assert.equal(getCwd(state), "/projects");
  assert.ok(result.output.startsWith("Projects:\n"));
  assert.ok(result.output.includes("ascii-os"));
});

test("project alias requires slug", () => {
  const state = createInitialState();

  const result = runCliCommand(state, "project", []);

  assert.equal(result.output, "Usage: project <slug>");
});

test("project alias opens project card content", () => {
  const state = createInitialState();

  const result = runCliCommand(state, "project", ["ascii-os"]);

  assert.equal(getCwd(state), "/projects");
  assert.ok(result.output.toLowerCase().includes("ascii-os"));
});

test("about and cv aliases open index content in target directories", () => {
  const state = createInitialState();

  const aboutResult = runCliCommand(state, "about", []);
  assert.equal(getCwd(state), "/about");
  assert.ok(aboutResult.output.length > 0);

  const cvResult = runCliCommand(state, "cv", []);
  assert.equal(getCwd(state), "/cv");
  assert.ok(cvResult.output.length > 0);
});

test("guide alias returns quick navigation output", () => {
  const state = createInitialState();

  const result = runCliCommand(state, "guide", []);

  assert.ok(result.output.includes("ASCII-OS Portfolio Guide"));
  assert.ok(result.output.includes("project <slug>"));
});

test("help output is extended with portfolio shortcuts", () => {
  const state = createInitialState();

  const result = runCliCommand(state, "help", []);

  assert.ok(result.output.includes("Available commands:"));
  assert.ok(result.output.includes("Portfolio shortcuts:"));
  assert.ok(result.output.includes("project <slug>"));
});

test("non-alias commands still dispatch to engine", () => {
  const state = createInitialState();

  const result = runCliCommand(state, "pwd", []);

  assert.equal(result.output, "/");
});

test("cls alias maps to clear command", () => {
  const state = createInitialState();

  const result = runCliCommand(state, "cls", []);

  assert.equal(result.output, "");
  assert.equal(result.clear, true);
});

test("cga/ega/vga aliases set screen modes", () => {
  const state = createInitialState();

  const cga = runCliCommand(state, "cga", []);
  const ega = runCliCommand(state, "ega", []);
  const vga = runCliCommand(state, "vga", []);

  assert.equal(cga.screenMode, "cga");
  assert.equal(ega.screenMode, "ega");
  assert.equal(vga.screenMode, "vga");
  assert.equal(getScreenMode(state), "vga");
});

test("mode alias returns current mode", () => {
  const state = createInitialState();

  const initial = runCliCommand(state, "mode", []);
  runCliCommand(state, "ega", []);
  const changed = runCliCommand(state, "mode", []);

  assert.equal(initial.output, "Display mode: CGA 80x25.");
  assert.equal(changed.output, "Display mode: EGA 80x43.");
  assert.equal(changed.screenMode, "ega");
});
