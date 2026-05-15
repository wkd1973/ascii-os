import { getCwd, setCwd, type SystemState } from "./state";
import { getBaseName, getDirectoryAtPath, getFileAtPath, getNodeAtPath, normalizePath } from "./path";
import { parseArgs } from "./parser";
import type { DirectoryNode } from "./types";

export type CommandResult = {
  output: string;
  exit?: boolean;
  clear?: boolean;
  reboot?: boolean;
  screenMode?: "cga" | "ega" | "vga";
  animate?: boolean;
  aocMode?: boolean;
  theme?: string;
};

export type CommandHandler = (state: SystemState, args: string[]) => CommandResult;
export type CommandRegistry = Record<string, CommandHandler>;

const helpCommand: CommandHandler = () => ({
  output: [
    "Core filesystem commands:",
    "  help                Show this help",
    "  ls [path]           List directory entries",
    "  cd <path>           Change current directory",
    "  open <path>         Show file content",
    "  pwd                 Show current directory",
    "  cat <path>          Print file content",
    "  tree [path]         Show directory tree",
    "",
    "Session commands:",
    "  clear               Clear the console screen",
    "  reboot              Simulate system reboot",
    "  shutdown            Shut down ASCII-OS",
    "  exit                Exit ASCII-OS",
    "  quit                Exit ASCII-OS"
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
const shutdownCommand: CommandHandler = () => ({ output: "System halted.", exit: true });
const clearCommand: CommandHandler = () => ({ output: "", clear: true });
const rebootCommand: CommandHandler = () => ({ output: "", clear: true, reboot: true });

export const createCommandRegistry = (): CommandRegistry => ({
  help: helpCommand,
  ls: lsCommand,
  cd: cdCommand,
  pwd: pwdCommand,
  open: openCommand,
  cat: catCommand,
  tree: treeCommand,
  clear: clearCommand,
  reboot: rebootCommand,
  shutdown: shutdownCommand,
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
  const parsed = parseArgs(input);
  if (parsed.length === 0) {
    return { output: "" };
  }

  const [name, ...args] = parsed;
  return dispatchCommand(state, name, args);
};
