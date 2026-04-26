"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCommand = exports.dispatchCommand = void 0;
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
        "  exit                Exit ASCII-OS"
    ].join("\n")
});
const lsCommand = (state, args) => {
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
const exitCommand = () => ({ output: "Shutting down ASCII-OS.", exit: true });
const handlers = {
    help: helpCommand,
    ls: lsCommand,
    cd: cdCommand,
    pwd: pwdCommand,
    open: openCommand,
    exit: exitCommand,
    quit: exitCommand
};
const dispatchCommand = (state, name, args) => {
    const handler = handlers[name.toLowerCase()];
    if (!handler) {
        return { output: `Unknown command: ${name}. Type 'help'.` };
    }
    return handler(state, args);
};
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
