const test = require("node:test");
const assert = require("node:assert/strict");

const { createInitialState } = require("../build/engine/state.js");
const { runCliCommand } = require("../build/cli/aliases.js");
const { dispatchCommand } = require("../build/engine/commands.js");

test("set command updates config in-memory", () => {
  const state = createInitialState();
  
  // Initial check
  assert.equal(state.config.screenMode, "cga");
  
  // Set screenMode
  const result = runCliCommand(state, "set", ["screenMode", "ega"]);
  assert.equal(result.output, "screenMode set to ega");
  assert.equal(state.config.screenMode, "ega");
  assert.equal(result.screenMode, "ega");
});

test("set command updates promptTemplate in-memory", () => {
  const state = createInitialState();
  
  const result = runCliCommand(state, "set", ["promptTemplate", "new-prompt:"]);
  assert.equal(result.output, "promptTemplate set to new-prompt:");
  assert.equal(state.config.promptTemplate, "new-prompt:");
});

test("set command updates theme in-memory", () => {
  const state = createInitialState();
  
  const result = runCliCommand(state, "set", ["theme", "green"]);
  assert.equal(result.output, "theme set to green");
  assert.equal(state.config.theme, "green");
});

test("set command without args shows configuration", () => {
  const state = createInitialState();
  
  const result = runCliCommand(state, "set", []);
  assert.ok(result.output.includes("System Configuration:"));
  assert.ok(result.output.includes("screenMode:      cga"));
  assert.ok(result.output.includes("theme:           default"));
});

test("set command validates screenMode", () => {
  const state = createInitialState();
  
  const result = runCliCommand(state, "set", ["screenMode", "invalid"]);
  assert.equal(result.output, "Error: screenMode must be cga, ega, or vga");
  assert.equal(state.config.screenMode, "cga");
});
