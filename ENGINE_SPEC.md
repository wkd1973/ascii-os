# ASCII-OS Engine Contract (v0.1)

This document defines the stable kernel contract for the CLI-first phase.
Engine modules must stay UI-agnostic and expose deterministic command behavior.

## Scope

- Engine owns virtual filesystem navigation and read operations.
- CLI/UI layers are adapters that call engine functions.
- Engine does not import from `/cli` or `/ui`.

## Kernel Command Scope

- The engine command registry is the filesystem kernel surface.
- CLI and web layers may add aliases and presentation commands on top.
- Current built-in engine commands are:
  - `help`
  - `ls`
  - `cd`
  - `open`
  - `pwd`
  - `cat`
  - `tree`
  - `clear`
  - `reboot`
  - `shutdown`
  - `exit`
  - `quit`

## Command Freeze Policy

- No new engine command names should be added casually.
- A new engine command can be introduced only if the core filesystem flow cannot be completed without it.
- Any approved exception must include:
  - a short rationale in PR/commit message
  - tests for the new behavior
  - a spec update in this file

## Public API

### `createInitialState(): SystemState`

- Creates runtime state with:
  - `root: DirectoryNode` loaded from `content/data` (fallback to static `rootFs`)
  - `cwd: "/"` as the initial working directory

### `getCwd(state: SystemState): string`

- Returns current absolute working directory.

### `setCwd(state: SystemState, cwd: string): void`

- Updates current working directory.
- Callers should pass normalized, existing directory paths.

### `dispatchCommand(state: SystemState, name: string, args: string[]): CommandResult`

- Command dispatcher.
- Command name is case-insensitive.
- Unknown command returns:
  - `Unknown command: <name>. Type 'help'.`

### `runCommand(state: SystemState, input: string): CommandResult`

- Parses input using `parseArgs` (supports quotes and escaping).
- Empty/whitespace-only input returns `{ output: "" }`.
- Dispatches to the registry based on the first token.

## Command Result Contract

```ts
type CommandResult = {
  output: string;
  exit?: boolean;
  clear?: boolean;
  reboot?: boolean;
  screenMode?: "cga" | "ega" | "vga";
};
```

- `output` is always a string (possibly empty).
- `exit === true` is emitted only by exit-style commands.
- `clear === true` requests the caller to clear the display.
- `reboot === true` requests the caller to reinitialize the session state.
- `screenMode` is used by CLI/web presentation layers.

## Built-in Commands

### `help`

- Prints command list and usage hints.

### `ls [path]`

- Max one argument, else `ls: too many arguments`
- Missing path defaults to `.`
- Non-existing path:
  - `ls: cannot access '<path>': No such file or directory`
- File target: prints basename
- Directory target: prints sorted entries; directories are suffixed with `/`
- Empty directory: `(empty)`

### `cd <path>`

- Max one argument, else `cd: too many arguments`
- No argument moves to `/`
- Missing directory:
  - `cd: <path>: No such directory`
- On success updates `cwd` and returns empty output

### `pwd`

- Returns current `cwd`.

### `open <path>`

- Max one argument, else `open: too many arguments`
- No argument: `open: missing file path`
- Directory target: `open: <path>: Is a directory`
- Missing file: `open: <path>: No such file`
- Existing file: returns file content

### `cat <path>`

- Same error/argument semantics as `open`
- Existing file: returns file content

### `tree [path]`

- Max one argument, else `tree: too many arguments`
- Missing path defaults to `.`
- Missing target:
  - `tree: cannot access '<path>': No such file or directory`
- File target: prints basename
- Directory target: prints ASCII tree

### `exit` / `quit`

- Returns output `Shutting down ASCII-OS.`
- Sets `exit: true`

### `clear`

- Returns empty output.
- Sets `clear: true`.

### `reboot`

- Returns empty output.
- Sets `clear: true` and `reboot: true`.

### `shutdown`

- Returns output `System halted.`
- Sets `exit: true`

## Path Semantics

### `normalizePath(cwd, inputPath)`

- Absolute input (`/x`) ignores `cwd`
- Relative input resolves from `cwd`
- Handles `.` as no-op
- Handles `..` as parent traversal
- Traversal above root is clamped to `/`

## Stability Rules (v0.1)

- Error message strings are part of the contract and must be test-covered.
- Existing command names and argument limits are stable.
- Any breaking change requires:
  - API/version note in this file
  - test updates proving intentional behavior change
