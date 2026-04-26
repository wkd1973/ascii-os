const test = require("node:test");
const assert = require("node:assert/strict");

const { createInitialState } = require("../build/engine/state.js");
const { normalizePath, getNodeAtPath, getDirectoryAtPath, getFileAtPath } = require("../build/engine/path.js");

test("normalizePath resolves absolute paths", () => {
  assert.equal(normalizePath("/home", "/projects"), "/projects");
});

test("normalizePath resolves relative paths", () => {
  assert.equal(normalizePath("/home", "identity.txt"), "/home/identity.txt");
});

test("normalizePath handles dot and dot-dot segments", () => {
  assert.equal(normalizePath("/home", "./file name.txt"), "/home/file name.txt");
  assert.equal(normalizePath("/home/projects", "../identity.txt"), "/home/identity.txt");
  assert.equal(normalizePath("/home", "../../"), "/");
});

test("path getters return null for non-existing paths", () => {
  const state = createInitialState();
  assert.equal(getNodeAtPath(state.root, "/missing"), null);
  assert.equal(getDirectoryAtPath(state.root, "/missing"), null);
  assert.equal(getFileAtPath(state.root, "/missing.txt"), null);
});

test("path getters return correct node types", () => {
  const state = createInitialState();
  const homeDir = getDirectoryAtPath(state.root, "/home");
  const identityFile = getFileAtPath(state.root, "/home/identity.txt");

  assert.ok(homeDir);
  assert.equal(homeDir.kind, "dir");
  assert.ok(identityFile);
  assert.equal(identityFile.kind, "file");
  assert.equal(getDirectoryAtPath(state.root, "/home/identity.txt"), null);
  assert.equal(getFileAtPath(state.root, "/home"), null);
});
