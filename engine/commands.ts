import { getCwd, setCwd, type SystemState } from "./state";
import { getBaseName, getDirectoryAtPath, getFileAtPath, getNodeAtPath, normalizePath } from "./path";

export type CommandResult = {
  output: string;
  exit?: boolean;
};

type CommandHandler = (state: SystemState, args: string[]) => CommandResult;

const helpCommand: CommandHandler = () => ({
  output: [
    "Available commands:",
    "  help                Show this help",
    "  ls [path]           List directory entries",
    "  cd <path>           Change current directory",
    "  pwd                 Show current directory",
    "  open <path>         Show file content",
    "  exit                Exit ASCII-OS"
  ].join("\n")
});

const lsCommand: CommandHandler = (state, args) => {
  const target = args[0] ?? ".";
  const absolutePath = normalizePath(getCwd(state), target);
  const node = getNodeAtPath(state.root, absolutePath);

  if (!node) {
    return { output: `ls: cannot access '${target}': No such file or directory` };
  }

  if (node.kind === "file") {
    return { output: getBaseName(absolutePath) };
  }

  const entries = Object.entries(node.children)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, child]) => (child.kind === "dir" ? `${name}/` : name));

  return { output: entries.join("\n") || "(empty)" };
};

const cdCommand: CommandHandler = (state, args) => {
  if (!args[0]) {
    setCwd(state, "/");
    return { output: "" };
  }

  const target = args[0];
  const absolutePath = normalizePath(getCwd(state), target);
  const directory = getDirectoryAtPath(state.root, absolutePath);

  if (!directory) {
    return { output: `cd: ${target}: No such directory` };
  }

  setCwd(state, absolutePath);
  return { output: "" };
};

const pwdCommand: CommandHandler = (state) => ({ output: getCwd(state) });

const openCommand: CommandHandler = (state, args) => {
  if (!args[0]) {
    return { output: "open: missing file path" };
  }

  const target = args[0];
  const absolutePath = normalizePath(getCwd(state), target);
  const file = getFileAtPath(state.root, absolutePath);

  if (!file) {
    const maybeNode = getNodeAtPath(state.root, absolutePath);
    if (maybeNode?.kind === "dir") {
      return { output: `open: ${target}: Is a directory` };
    }

    return { output: `open: ${target}: No such file` };
  }

  return { output: file.content };
};

const exitCommand: CommandHandler = () => ({ output: "Shutting down ASCII-OS.", exit: true });

const handlers: Record<string, CommandHandler> = {
  help: helpCommand,
  ls: lsCommand,
  cd: cdCommand,
  pwd: pwdCommand,
  open: openCommand,
  exit: exitCommand,
  quit: exitCommand
};

export const dispatchCommand = (state: SystemState, name: string, args: string[]): CommandResult => {
  const handler = handlers[name.toLowerCase()];

  if (!handler) {
    return { output: `Unknown command: ${name}. Type 'help'.` };
  }

  return handler(state, args);
};

export const runCommand = (state: SystemState, input: string): CommandResult => {
  const trimmed = input.trim();
  if (!trimmed) {
    return { output: "" };
  }

  const [name, ...args] = trimmed.split(/\s+/);
  return dispatchCommand(state, name, args);
};
