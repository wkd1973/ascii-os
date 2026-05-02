import { getCwd, setCwd, type SystemState } from "./state";
import { getBaseName, getDirectoryAtPath, getFileAtPath, getNodeAtPath, normalizePath } from "./path";
import type { DirectoryNode } from "./types";

export type CommandResult = {
  output: string;
  exit?: boolean;
  clear?: boolean;
  reboot?: boolean;
  screenMode?: "cga" | "ega" | "vga";
};

export type CommandHandler = (state: SystemState, args: string[]) => CommandResult;
export type CommandRegistry = Record<string, CommandHandler>;

const helpCommand: CommandHandler = () => ({
  output: [
    "Available commands:",
    "  help                Show this help",
    "  ls [path]           List directory entries",
    "  cd <path>           Change current directory",
    "  pwd                 Show current directory",
    "  open <path>         Show file content",
    "  cat <path>          Print file content",
    "  mkdir <path>        Create directory",
    "  touch <path>        Create empty file",
    "  write <p> <text>    Write file content",
    "  tree [path]         Show directory tree",
    "  clear               Clear the console screen",
    "  reboot              Simulate system reboot",
    "  exit                Exit ASCII-OS"
  ].join("\n")
});

const lsCommand: CommandHandler = (state, args) => {
  if (args.length > 1) {
    return { output: "ls: too many arguments" };
  }

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
  if (args.length > 1) {
    return { output: "cd: too many arguments" };
  }

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
  if (args.length > 1) {
    return { output: "open: too many arguments" };
  }

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

const catCommand: CommandHandler = (state, args) => {
  if (args.length > 1) {
    return { output: "cat: too many arguments" };
  }

  if (!args[0]) {
    return { output: "cat: missing file path" };
  }

  const target = args[0];
  const absolutePath = normalizePath(getCwd(state), target);
  const file = getFileAtPath(state.root, absolutePath);

  if (!file) {
    const maybeNode = getNodeAtPath(state.root, absolutePath);
    if (maybeNode?.kind === "dir") {
      return { output: `cat: ${target}: Is a directory` };
    }

    return { output: `cat: ${target}: No such file` };
  }

  return { output: file.content };
};

const getParentPath = (absolutePath: string): string => {
  const parts = absolutePath.split("/").filter(Boolean);
  if (parts.length <= 1) {
    return "/";
  }

  return `/${parts.slice(0, -1).join("/")}`;
};

const mkdirCommand: CommandHandler = (state, args) => {
  if (args.length > 1) {
    return { output: "mkdir: too many arguments" };
  }

  if (!args[0]) {
    return { output: "mkdir: missing directory path" };
  }

  const target = args[0];
  const absolutePath = normalizePath(getCwd(state), target);
  if (absolutePath === "/") {
    return { output: "mkdir: /: already exists" };
  }

  const existing = getNodeAtPath(state.root, absolutePath);
  if (existing) {
    return { output: `mkdir: ${target}: already exists` };
  }

  const parentPath = getParentPath(absolutePath);
  const parent = getDirectoryAtPath(state.root, parentPath);
  if (!parent) {
    return { output: `mkdir: cannot create directory '${target}': No such parent directory` };
  }

  const name = getBaseName(absolutePath);
  parent.children[name] = { kind: "dir", children: {} };
  return { output: "" };
};

const touchCommand: CommandHandler = (state, args) => {
  if (args.length > 1) {
    return { output: "touch: too many arguments" };
  }

  if (!args[0]) {
    return { output: "touch: missing file path" };
  }

  const target = args[0];
  const absolutePath = normalizePath(getCwd(state), target);
  if (absolutePath === "/") {
    return { output: "touch: /: Is a directory" };
  }

  const existing = getNodeAtPath(state.root, absolutePath);
  if (existing?.kind === "dir") {
    return { output: `touch: ${target}: Is a directory` };
  }

  if (existing?.kind === "file") {
    return { output: "" };
  }

  const parentPath = getParentPath(absolutePath);
  const parent = getDirectoryAtPath(state.root, parentPath);
  if (!parent) {
    return { output: `touch: cannot create file '${target}': No such parent directory` };
  }

  const name = getBaseName(absolutePath);
  parent.children[name] = { kind: "file", content: "" };
  return { output: "" };
};

const writeCommand: CommandHandler = (state, args) => {
  if (args.length < 2) {
    return { output: "write: usage: write <path> <content>" };
  }

  const [target, ...contentParts] = args;
  const content = contentParts.join(" ");
  const absolutePath = normalizePath(getCwd(state), target);
  if (absolutePath === "/") {
    return { output: "write: /: Is a directory" };
  }

  const existing = getNodeAtPath(state.root, absolutePath);
  if (existing?.kind === "dir") {
    return { output: `write: ${target}: Is a directory` };
  }

  const parentPath = getParentPath(absolutePath);
  const parent = getDirectoryAtPath(state.root, parentPath);
  if (!parent) {
    return { output: `write: cannot write '${target}': No such parent directory` };
  }

  const name = getBaseName(absolutePath);
  parent.children[name] = { kind: "file", content };
  return { output: "" };
};

const renderTree = (directory: DirectoryNode, label: string): string => {
  const lines: string[] = [label];

  const walk = (dir: DirectoryNode, prefix: string): void => {
    const entries = Object.entries(dir.children).sort(([a], [b]) => a.localeCompare(b));
    entries.forEach(([name, child], index) => {
      const isLast = index === entries.length - 1;
      const connector = isLast ? "`-- " : "|-- ";
      const suffix = child.kind === "dir" ? "/" : "";
      lines.push(`${prefix}${connector}${name}${suffix}`);

      if (child.kind === "dir") {
        const nextPrefix = prefix + (isLast ? "    " : "|   ");
        walk(child, nextPrefix);
      }
    });
  };

  walk(directory, "");
  return lines.join("\n");
};

const treeCommand: CommandHandler = (state, args) => {
  if (args.length > 1) {
    return { output: "tree: too many arguments" };
  }

  const target = args[0] ?? ".";
  const absolutePath = normalizePath(getCwd(state), target);
  const node = getNodeAtPath(state.root, absolutePath);

  if (!node) {
    return { output: `tree: cannot access '${target}': No such file or directory` };
  }

  if (node.kind === "file") {
    return { output: getBaseName(absolutePath) };
  }

  const label = absolutePath === "/" ? "/" : `${getBaseName(absolutePath)}/`;
  return { output: renderTree(node, label) };
};

const exitCommand: CommandHandler = () => ({ output: "Shutting down ASCII-OS.", exit: true });
const clearCommand: CommandHandler = () => ({ output: "", clear: true });
const rebootCommand: CommandHandler = () => ({ output: "", clear: true, reboot: true });

export const createCommandRegistry = (): CommandRegistry => ({
  help: helpCommand,
  ls: lsCommand,
  cd: cdCommand,
  pwd: pwdCommand,
  open: openCommand,
  cat: catCommand,
  mkdir: mkdirCommand,
  touch: touchCommand,
  write: writeCommand,
  tree: treeCommand,
  clear: clearCommand,
  reboot: rebootCommand,
  exit: exitCommand,
  quit: exitCommand
});

export const registerCommand = (
  registry: CommandRegistry,
  name: string,
  handler: CommandHandler
): CommandRegistry => {
  registry[name.toLowerCase()] = handler;
  return registry;
};

export const dispatchFromRegistry = (
  registry: CommandRegistry,
  state: SystemState,
  name: string,
  args: string[]
): CommandResult => {
  const handler = registry[name.toLowerCase()];

  if (!handler) {
    return { output: `Unknown command: ${name}. Type 'help'.` };
  }

  return handler(state, args);
};

const defaultRegistry = createCommandRegistry();

export const dispatchCommand = (state: SystemState, name: string, args: string[]): CommandResult =>
  dispatchFromRegistry(defaultRegistry, state, name, args);

export const runCommand = (state: SystemState, input: string): CommandResult => {
  const trimmed = input.trim();
  if (!trimmed) {
    return { output: "" };
  }

  const [name, ...args] = trimmed.split(/\s+/);
  return dispatchCommand(state, name, args);
};
