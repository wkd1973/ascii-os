const test = require("node:test");
const assert = require("node:assert/strict");

const { createInitialState, getCwd } = require("../build/engine/state.js");
const {
  createCommandRegistry,
  dispatchCommand,
  dispatchFromRegistry,
  registerCommand,
  runCommand
} = require("../build/engine/commands.js");

test("cd changes cwd correctly", () => {
  const state = createInitialState();

  const result = dispatchCommand(state, "cd", ["home"]);

  assert.equal(result.output, "");
  assert.equal(getCwd(state), "/home");
});

test("help output groups filesystem and session commands", () => {
  const state = createInitialState();

  const result = dispatchCommand(state, "help", []);

  assert.ok(result.output.includes("Core filesystem commands:"));
  assert.ok(result.output.includes("Session commands:"));
  assert.ok(result.output.includes("quit"));
});

test("ls returns sorted children for current directory", () => {
  const state = createInitialState();

  const result = dispatchCommand(state, "ls", []);

  assert.equal(result.output, "about/\ncv/\nhome/\nlogs/\nprojects/\nsystem/");
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

test("cd handles parent navigation with ..", () => {
  const state = createInitialState();
  dispatchCommand(state, "cd", ["/projects/ascii-os"]);

  const result = dispatchCommand(state, "cd", [".."]);

  assert.equal(result.output, "");
  assert.equal(getCwd(state), "/projects");
});

test("cd rejects too many arguments", () => {
  const state = createInitialState();

  const result = dispatchCommand(state, "cd", ["home", "projects"]);

  assert.equal(result.output, "cd: too many arguments");
  assert.equal(getCwd(state), "/");
});

test("ls supports absolute path and file path", () => {
  const state = createInitialState();

  const dirList = dispatchCommand(state, "ls", ["/home"]);
  const fileList = dispatchCommand(state, "ls", ["/system/motd.txt"]);
  const homeEntries = dirList.output.split("\n");
  const sortedHomeEntries = [...homeEntries].sort((a, b) => a.localeCompare(b));

  assert.deepEqual(homeEntries, sortedHomeEntries);
  assert.ok(homeEntries.includes("identity.txt"));
  assert.equal(fileList.output, "motd.txt");
});

test("ls rejects too many arguments", () => {
  const state = createInitialState();

  const result = dispatchCommand(state, "ls", ["/home", "/projects"]);

  assert.equal(result.output, "ls: too many arguments");
});

test("open reports missing file and directory target", () => {
  const state = createInitialState();

  const missing = dispatchCommand(state, "open", ["missing.txt"]);
  const directory = dispatchCommand(state, "open", ["/home"]);

  assert.equal(missing.output, "open: missing.txt: No such file");
  assert.equal(directory.output, "open: /home: Is a directory");
});

test("open rejects too many arguments", () => {
  const state = createInitialState();

  const result = dispatchCommand(state, "open", ["a.txt", "b.txt"]);

  assert.equal(result.output, "open: too many arguments");
});

test("dispatchCommand is case-insensitive and reports unknown command", () => {
  const state = createInitialState();

  const upper = dispatchCommand(state, "LS", []);
  const unknown = dispatchCommand(state, "foo", []);

  assert.equal(upper.output, "about/\ncv/\nhome/\nlogs/\nprojects/\nsystem/");
  assert.equal(unknown.output, "Unknown command: foo. Type 'help'.");
});

test("cat returns file content", () => {
  const state = createInitialState();

  const result = dispatchCommand(state, "cat", ["/home/identity.txt"]);

  assert.equal(result.output.trimEnd(), "wkd1973: builder, explorer, CLI-first developer.");
});

test("cat reports missing argument", () => {
  const state = createInitialState();

  const result = dispatchCommand(state, "cat", []);

  assert.equal(result.output, "cat: missing file path");
});

test("cat reports directory and missing file errors", () => {
  const state = createInitialState();

  const dirResult = dispatchCommand(state, "cat", ["/home"]);
  const missingResult = dispatchCommand(state, "cat", ["missing.txt"]);

  assert.equal(dirResult.output, "cat: /home: Is a directory");
  assert.equal(missingResult.output, "cat: missing.txt: No such file");
});

test("cat rejects too many arguments", () => {
  const state = createInitialState();

  const result = dispatchCommand(state, "cat", ["a.txt", "b.txt"]);

  assert.equal(result.output, "cat: too many arguments");
});

test("tree renders current directory tree", () => {
  const state = createInitialState();

  const result = dispatchCommand(state, "tree", []);
  const lines = result.output.split("\n");

  assert.equal(lines[0], "/");
  assert.ok(lines.some((line) => line.includes("home/")));
  assert.ok(lines.some((line) => line.includes("projects/")));
});

test("tree renders target directory and file input", () => {
  const state = createInitialState();

  const dirResult = dispatchCommand(state, "tree", ["/home"]);
  const fileResult = dispatchCommand(state, "tree", ["/system/motd.txt"]);

  assert.equal(dirResult.output.split("\n")[0], "home/");
  assert.ok(dirResult.output.includes("identity.txt"));
  assert.equal(fileResult.output, "motd.txt");
});

test("tree reports missing path and too many args", () => {
  const state = createInitialState();

  const missing = dispatchCommand(state, "tree", ["/missing"]);
  const manyArgs = dispatchCommand(state, "tree", ["/home", "/projects"]);

  assert.equal(missing.output, "tree: cannot access '/missing': No such file or directory");
  assert.equal(manyArgs.output, "tree: too many arguments");
});

test("runCommand returns empty output for blank input", () => {
  const state = createInitialState();

  const result = runCommand(state, "   ");

  assert.equal(result.output, "");
});

test("runCommand splits by whitespace and executes command", () => {
  const state = createInitialState();

  const result = runCommand(state, "cd   home");

  assert.equal(result.output, "");
  assert.equal(getCwd(state), "/home");
});

test("runCommand handles quoted arguments with spaces", () => {
  const state = createInitialState();
  
  // Use open with quotes on existing file
  const openResult = runCommand(state, 'open "/home/file name.txt"');
  assert.equal(openResult.output.trim(), "Quoted path parsing works.");
});

test("open and cat can access file names with spaces via dispatch args", () => {
  const state = createInitialState();
  dispatchCommand(state, "cd", ["/home"]);

  const openResult = dispatchCommand(state, "open", ["file name.txt"]);
  const catResult = dispatchCommand(state, "cat", ["file name.txt"]);

  assert.equal(openResult.output.trim(), "Quoted path parsing works.");
  assert.equal(catResult.output.trim(), "Quoted path parsing works.");
});

test("cd with no args returns to root", () => {
  const state = createInitialState();
  dispatchCommand(state, "cd", ["/projects/ascii-os"]);

  const result = dispatchCommand(state, "cd", []);

  assert.equal(result.output, "");
  assert.equal(getCwd(state), "/");
});

test("ls and tree resolve dot-segment paths", () => {
  const state = createInitialState();
  dispatchCommand(state, "cd", ["/home"]);

  const lsResult = dispatchCommand(state, "ls", ["./"]);
  const treeResult = dispatchCommand(state, "tree", ["./"]);

  assert.ok(lsResult.output.includes("identity.txt"));
  assert.equal(treeResult.output.split("\n")[0], "home/");
});

test("custom registry supports plugin commands", () => {
  const state = createInitialState();
  const registry = createCommandRegistry();
  registerCommand(registry, "echo", (_state, args) => ({ output: args.join(" ") }));

  const result = dispatchFromRegistry(registry, state, "ECHO", ["ascii", "os"]);

  assert.equal(result.output, "ascii os");
});

test("clear returns clear flag", () => {
  const state = createInitialState();

  const result = dispatchCommand(state, "clear", []);

  assert.equal(result.output, "");
  assert.equal(result.clear, true);
});

test("reboot returns reboot and clear flags", () => {
  const state = createInitialState();

  const result = dispatchCommand(state, "reboot", []);

  assert.equal(result.output, "");
  assert.equal(result.clear, true);
  assert.equal(result.reboot, true);
});

test("shutdown exits with halt message", () => {
  const state = createInitialState();

  const result = dispatchCommand(state, "shutdown", []);

  assert.equal(result.output, "System halted.");
  assert.equal(result.exit, true);
});
