const test = require("node:test");
const assert = require("node:assert/strict");

const { createInitialState, getCwd } = require("../build/engine/state.js");
const { getScreenMode, runCliCommand } = require("../build/cli/aliases.js");

const addProjectCard = (state, slug) => {
  const projects = state.root.children.projects;
  assert.equal(projects.kind, "dir");
  projects.children[slug] = {
    kind: "dir",
    children: {
      "index.txt": {
        kind: "file",
        content: `Name: ${slug}\nDescription: Dynamic test project`
      }
    }
  };
};

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
  assert.ok(result.output.startsWith("PROJECTS OVERVIEW"));
  assert.ok(result.output.includes("Available project cards:"));
  assert.ok(result.output.includes("izyda"));
});

test("projects alias lists project cards from virtual filesystem", () => {
  const state = createInitialState();
  addProjectCard(state, "new-project");

  const result = runCliCommand(state, "projects", []);

  assert.ok(result.output.includes("- new-project"));
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
  assert.ok(result.output.includes("Project cards:"));
  assert.ok(result.output.includes("izyda"));
  assert.ok(result.output.includes("Project card format:"));
  assert.ok(result.output.includes("projects"));
  assert.ok(result.output.includes("project <slug>"));
});

test("guide lists project cards from virtual filesystem", () => {
  const state = createInitialState();
  addProjectCard(state, "dynamic-card");

  const result = runCliCommand(state, "guide", []);

  assert.ok(result.output.includes("  dynamic-card"));
});

test("help output is extended with portfolio shortcuts", () => {
  const state = createInitialState();

  const result = runCliCommand(state, "help", []);

  assert.ok(result.output.includes("Core filesystem commands:"));
  assert.ok(result.output.includes("Session commands:"));
  assert.ok(result.output.includes("Portfolio shortcuts:"));
  assert.ok(result.output.includes("DOS-style commands:"));
  assert.ok(result.output.includes("Display modes:"));
  assert.ok(result.output.includes("Prompt:"));
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

test("dir and type aliases map to DOS-like file commands", () => {
  const state = createInitialState();

  const dirResult = runCliCommand(state, "dir", ["/home"]);
  const typeResult = runCliCommand(state, "type", ["/home/identity.txt"]);

  assert.ok(dirResult.output.includes("identity.txt"));
  assert.equal(typeResult.output.trimEnd(), "wkd1973: builder, explorer, CLI-first developer.");
});

test("ver, date, and time aliases return system info", () => {
  const state = createInitialState();

  const ver = runCliCommand(state, "ver", []);
  const date = runCliCommand(state, "date", []);
  const time = runCliCommand(state, "time", []);

  assert.equal(ver.output, "ASCII-OS version 0.1.0");
  assert.match(date.output, /^\d{4}-\d{2}-\d{2} UTC$/);
  assert.match(time.output, /^\d{2}:\d{2}:\d{2} UTC$/);
});

test("shutdown alias exits the session", () => {
  const state = createInitialState();

  const result = runCliCommand(state, "shutdown", []);

  assert.equal(result.output, "System halted.");
  assert.equal(result.exit, true);
});

test("whoami returns current user identity", () => {
  const state = createInitialState();

  const result = runCliCommand(state, "whoami", []);

  assert.equal(result.output, "wkd1973");
});

test("prompt shows and updates the current prompt template", () => {
  const state = createInitialState();

  const initial = runCliCommand(state, "prompt", []);
  const changed = runCliCommand(state, "prompt", ["[$p]$g"]);
  const current = runCliCommand(state, "prompt", []);
  const restored = runCliCommand(state, "prompt", ["default"]);

  assert.equal(initial.output, "Prompt template: ascii-os:[$p]$g$s");
  assert.equal(changed.output, "Prompt template set to [$p]$g");
  assert.equal(current.output, "Prompt template: [$p]$g");
  assert.equal(restored.output, "Prompt template set to ascii-os:[$p]$g$s");
});
