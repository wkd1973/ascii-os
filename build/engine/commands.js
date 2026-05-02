"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCommand = exports.dispatchCommand = exports.dispatchFromRegistry = exports.registerCommand = exports.createCommandRegistry = void 0;
const state_1 = require("./state");
const path_1 = require("./path");
const helpCommand = () => ({
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
const lsCommand = (state, args) => {
    if (args.length > 1) {
        return { output: "ls: too many arguments" };
    }
    const target = args[0] ?? ".";
    const absolutePath = (0, path_1.normalizePath)((0, state_1.getCwd)(state), target);
    const node = (0, path_1.getNodeAtPath)(state.root, absolutePath);
    if (!node) {
        return { output: `ls: cannot access '${target}': No such file or directory` };
    }
    if (node.kind === "file") {
        return { output: (0, path_1.getBaseName)(absolutePath) };
    }
    const entries = Object.entries(node.children)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, child]) => (child.kind === "dir" ? `${name}/` : name));
    return { output: entries.join("\n") || "(empty)" };
};
const cdCommand = (state, args) => {
    if (args.length > 1) {
        return { output: "cd: too many arguments" };
    }
    if (!args[0]) {
        (0, state_1.setCwd)(state, "/");
        return { output: "" };
    }
    const target = args[0];
    const absolutePath = (0, path_1.normalizePath)((0, state_1.getCwd)(state), target);
    const directory = (0, path_1.getDirectoryAtPath)(state.root, absolutePath);
    if (!directory) {
        return { output: `cd: ${target}: No such directory` };
    }
    (0, state_1.setCwd)(state, absolutePath);
    return { output: "" };
};
const pwdCommand = (state) => ({ output: (0, state_1.getCwd)(state) });
const openCommand = (state, args) => {
    if (args.length > 1) {
        return { output: "open: too many arguments" };
    }
    if (!args[0]) {
        return { output: "open: missing file path" };
    }
    const target = args[0];
    const absolutePath = (0, path_1.normalizePath)((0, state_1.getCwd)(state), target);
    const file = (0, path_1.getFileAtPath)(state.root, absolutePath);
    if (!file) {
        const maybeNode = (0, path_1.getNodeAtPath)(state.root, absolutePath);
        if (maybeNode?.kind === "dir") {
            return { output: `open: ${target}: Is a directory` };
        }
        return { output: `open: ${target}: No such file` };
    }
    return { output: file.content };
};
const catCommand = (state, args) => {
    if (args.length > 1) {
        return { output: "cat: too many arguments" };
    }
    if (!args[0]) {
        return { output: "cat: missing file path" };
    }
    const target = args[0];
    const absolutePath = (0, path_1.normalizePath)((0, state_1.getCwd)(state), target);
    const file = (0, path_1.getFileAtPath)(state.root, absolutePath);
    if (!file) {
        const maybeNode = (0, path_1.getNodeAtPath)(state.root, absolutePath);
        if (maybeNode?.kind === "dir") {
            return { output: `cat: ${target}: Is a directory` };
        }
        return { output: `cat: ${target}: No such file` };
    }
    return { output: file.content };
};
const getParentPath = (absolutePath) => {
    const parts = absolutePath.split("/").filter(Boolean);
    if (parts.length <= 1) {
        return "/";
    }
    return `/${parts.slice(0, -1).join("/")}`;
};
const mkdirCommand = (state, args) => {
    if (args.length > 1) {
        return { output: "mkdir: too many arguments" };
    }
    if (!args[0]) {
        return { output: "mkdir: missing directory path" };
    }
    const target = args[0];
    const absolutePath = (0, path_1.normalizePath)((0, state_1.getCwd)(state), target);
    if (absolutePath === "/") {
        return { output: "mkdir: /: already exists" };
    }
    const existing = (0, path_1.getNodeAtPath)(state.root, absolutePath);
    if (existing) {
        return { output: `mkdir: ${target}: already exists` };
    }
    const parentPath = getParentPath(absolutePath);
    const parent = (0, path_1.getDirectoryAtPath)(state.root, parentPath);
    if (!parent) {
        return { output: `mkdir: cannot create directory '${target}': No such parent directory` };
    }
    const name = (0, path_1.getBaseName)(absolutePath);
    parent.children[name] = { kind: "dir", children: {} };
    return { output: "" };
};
const touchCommand = (state, args) => {
    if (args.length > 1) {
        return { output: "touch: too many arguments" };
    }
    if (!args[0]) {
        return { output: "touch: missing file path" };
    }
    const target = args[0];
    const absolutePath = (0, path_1.normalizePath)((0, state_1.getCwd)(state), target);
    if (absolutePath === "/") {
        return { output: "touch: /: Is a directory" };
    }
    const existing = (0, path_1.getNodeAtPath)(state.root, absolutePath);
    if (existing?.kind === "dir") {
        return { output: `touch: ${target}: Is a directory` };
    }
    if (existing?.kind === "file") {
        return { output: "" };
    }
    const parentPath = getParentPath(absolutePath);
    const parent = (0, path_1.getDirectoryAtPath)(state.root, parentPath);
    if (!parent) {
        return { output: `touch: cannot create file '${target}': No such parent directory` };
    }
    const name = (0, path_1.getBaseName)(absolutePath);
    parent.children[name] = { kind: "file", content: "" };
    return { output: "" };
};
const writeCommand = (state, args) => {
    if (args.length < 2) {
        return { output: "write: usage: write <path> <content>" };
    }
    const [target, ...contentParts] = args;
    const content = contentParts.join(" ");
    const absolutePath = (0, path_1.normalizePath)((0, state_1.getCwd)(state), target);
    if (absolutePath === "/") {
        return { output: "write: /: Is a directory" };
    }
    const existing = (0, path_1.getNodeAtPath)(state.root, absolutePath);
    if (existing?.kind === "dir") {
        return { output: `write: ${target}: Is a directory` };
    }
    const parentPath = getParentPath(absolutePath);
    const parent = (0, path_1.getDirectoryAtPath)(state.root, parentPath);
    if (!parent) {
        return { output: `write: cannot write '${target}': No such parent directory` };
    }
    const name = (0, path_1.getBaseName)(absolutePath);
    parent.children[name] = { kind: "file", content };
    return { output: "" };
};
const renderTree = (directory, label) => {
    const lines = [label];
    const walk = (dir, prefix) => {
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
const treeCommand = (state, args) => {
    if (args.length > 1) {
        return { output: "tree: too many arguments" };
    }
    const target = args[0] ?? ".";
    const absolutePath = (0, path_1.normalizePath)((0, state_1.getCwd)(state), target);
    const node = (0, path_1.getNodeAtPath)(state.root, absolutePath);
    if (!node) {
        return { output: `tree: cannot access '${target}': No such file or directory` };
    }
    if (node.kind === "file") {
        return { output: (0, path_1.getBaseName)(absolutePath) };
    }
    const label = absolutePath === "/" ? "/" : `${(0, path_1.getBaseName)(absolutePath)}/`;
    return { output: renderTree(node, label) };
};
const exitCommand = () => ({ output: "Shutting down ASCII-OS.", exit: true });
const clearCommand = () => ({ output: "", clear: true });
const rebootCommand = () => ({ output: "", clear: true, reboot: true });
const createCommandRegistry = () => ({
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
exports.createCommandRegistry = createCommandRegistry;
const registerCommand = (registry, name, handler) => {
    registry[name.toLowerCase()] = handler;
    return registry;
};
exports.registerCommand = registerCommand;
const dispatchFromRegistry = (registry, state, name, args) => {
    const handler = registry[name.toLowerCase()];
    if (!handler) {
        return { output: `Unknown command: ${name}. Type 'help'.` };
    }
    return handler(state, args);
};
exports.dispatchFromRegistry = dispatchFromRegistry;
const defaultRegistry = (0, exports.createCommandRegistry)();
const dispatchCommand = (state, name, args) => (0, exports.dispatchFromRegistry)(defaultRegistry, state, name, args);
exports.dispatchCommand = dispatchCommand;
const runCommand = (state, input) => {
    const trimmed = input.trim();
    if (!trimmed) {
        return { output: "" };
    }
    const [name, ...args] = trimmed.split(/\s+/);
    return (0, exports.dispatchCommand)(state, name, args);
};
exports.runCommand = runCommand;
