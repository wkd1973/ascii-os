"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCommand = exports.dispatchCommand = exports.dispatchFromRegistry = exports.registerCommand = exports.createCommandRegistry = void 0;
const state_1 = require("./state");
const path_1 = require("./path");
const parser_1 = require("./parser");
const helpCommand = () => ({
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
const shutdownCommand = () => ({ output: "System halted.", exit: true });
const clearCommand = () => ({ output: "", clear: true });
const rebootCommand = () => ({ output: "", clear: true, reboot: true });
const createCommandRegistry = () => ({
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
    const parsed = (0, parser_1.parseArgs)(input);
    if (parsed.length === 0) {
        return { output: "" };
    }
    const [name, ...args] = parsed;
    return (0, exports.dispatchCommand)(state, name, args);
};
exports.runCommand = runCommand;
