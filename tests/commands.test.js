const test = require("node:test");
const assert = require("node:assert/strict");

const { createInitialState, getCwd } = require("../build/engine/state.js");
const { dispatchCommand } = require("../build/engine/commands.js");

test("cd changes cwd correctly", () => {
  const state = createInitialState();

  const result = dispatchCommand(state, "cd", ["home"]);

  assert.equal(result.output, "");
  assert.equal(getCwd(state), "/home");
});

test("ls returns sorted children for current directory", () => {
  const state = createInitialState();

  const result = dispatchCommand(state, "ls", []);

  assert.equal(result.output, "about/\ncv/\nhome/\nprojects/\nsystem/");
});

test("open returns file content", () => {
  const state = createInitialState();
  dispatchCommand(state, "cd", ["home"]);

  const result = dispatchCommand(state, "open", ["identity.txt"]);

  assert.equal(result.output.trimEnd(), "wkd1973: builder, explorer, CLI-first developer.");
});

test("pwd returns current working directory", () => {
  const state = createInitialState();
  dispatchCommand(state, "cd", ["projects"]);

  const result = dispatchCommand(state, "pwd", []);

  assert.equal(result.output, "/projects");
});
