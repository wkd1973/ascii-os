"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_readline_1 = __importDefault(require("node:readline"));
const node_process_1 = require("node:process");
const commands_1 = require("../engine/commands");
const state_1 = require("../engine/state");
const state = (0, state_1.createInitialState)();
const rl = node_readline_1.default.createInterface({
    input: node_process_1.stdin,
    output: node_process_1.stdout
});
const ask = (prompt) => new Promise((resolve) => {
    rl.question(prompt, resolve);
});
const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    blue: "\x1b[34m"
};
const getPrompt = () => `ascii-os:[${(0, state_1.getCwd)(state)}]> `;
const parseArgs = (line) => {
    const tokens = [];
    let current = "";
    let inQuotes = false;
    let escaping = false;
    for (const char of line) {
        if (escaping) {
            current += char;
            escaping = false;
            continue;
        }
        if (char === "\\") {
            escaping = true;
            continue;
        }
        if (char === "\"") {
            inQuotes = !inQuotes;
            continue;
        }
        if (!inQuotes && /\s/.test(char)) {
            if (current.length > 0) {
                tokens.push(current);
                current = "";
            }
            continue;
        }
        current += char;
    }
    if (escaping) {
        current += "\\";
    }
    if (current.length > 0) {
        tokens.push(current);
    }
    return tokens;
};
const boot = () => {
    node_process_1.stdout.write("BOOTING ASCII-OS PORTFOLIO...\n");
    node_process_1.stdout.write("LOADING CONTENT FROM /content/data...\n");
    node_process_1.stdout.write("INITIALIZING USER SESSION...\n");
    node_process_1.stdout.write("WELCOME, OPERATOR\n\n");
};
const isErrorOutput = (output) => /^(Unknown command:|ls:|cd:|open:)/.test(output);
const isInfoOutput = (command) => command === "help" || command === "exit" || command === "quit" || command === "guide";
const colorize = (color, text) => `${color}${text}${colors.reset}`;
const renderInfo = (output) => {
    if (output.length === 0) {
        return;
    }
    node_process_1.stdout.write(`${colorize(colors.blue, "[INFO]")} ${output}\n\n`);
};
const renderResult = (command, output) => {
    if (output.length === 0) {
        node_process_1.stdout.write(`${colorize(colors.green, "[OK]")} Command executed.\n\n`);
        return;
    }
    if (isErrorOutput(output)) {
        node_process_1.stdout.write(`${colorize(colors.red, "[ERR]")} ${output}\n\n`);
        return;
    }
    if (isInfoOutput(command)) {
        node_process_1.stdout.write(`${colorize(colors.blue, "[INFO]")} ${output}\n\n`);
        return;
    }
    node_process_1.stdout.write(`${colorize(colors.green, "[OK]")} ${output}\n\n`);
};
const formatProjectsListing = (lsOutput) => {
    const slugs = lsOutput
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => line.replace(/\/$/, ""));
    if (slugs.length === 0 || slugs[0] === "(empty)") {
        return "Projects: (empty)";
    }
    const body = slugs.map((slug) => `  - ${slug}`).join("\n");
    return ["Projects:", body, "", "Use: project <slug> or open <slug>/index.txt"].join("\n");
};
const runAlias = (command, args) => {
    if (command === "home") {
        return (0, commands_1.dispatchCommand)(state, "cd", ["/home"]);
    }
    if (command === "projects") {
        const move = (0, commands_1.dispatchCommand)(state, "cd", ["/projects"]);
        if (isErrorOutput(move.output)) {
            return move;
        }
        const list = (0, commands_1.dispatchCommand)(state, "ls", []);
        if (isErrorOutput(list.output)) {
            return list;
        }
        return {
            ...list,
            output: formatProjectsListing(list.output)
        };
    }
    if (command === "about") {
        const move = (0, commands_1.dispatchCommand)(state, "cd", ["/about"]);
        if (isErrorOutput(move.output)) {
            return move;
        }
        return (0, commands_1.dispatchCommand)(state, "open", ["index.txt"]);
    }
    if (command === "cv") {
        const move = (0, commands_1.dispatchCommand)(state, "cd", ["/cv"]);
        if (isErrorOutput(move.output)) {
            return move;
        }
        return (0, commands_1.dispatchCommand)(state, "open", ["index.txt"]);
    }
    if (command === "guide") {
        return {
            output: [
                "ASCII-OS Portfolio Guide",
                "",
                "Quick flow:",
                "  home                Jump to /home",
                "  projects            Show project slugs",
                "  project <slug>      Open project card",
                "  about               Open profile",
                "  cv                  Open CV summary",
                "",
                "Explore manually:",
                "  ls",
                "  cd <path>",
                "  open <path>",
                "  pwd"
            ].join("\n")
        };
    }
    if (command === "project") {
        const slug = args[0];
        if (!slug) {
            return {
                output: "Usage: project <slug>"
            };
        }
        const move = (0, commands_1.dispatchCommand)(state, "cd", ["/projects"]);
        if (isErrorOutput(move.output)) {
            return move;
        }
        return (0, commands_1.dispatchCommand)(state, "open", [`${slug}/index.txt`]);
    }
    return null;
};
const runCommandWithUx = (command, args) => {
    const lower = command.toLowerCase();
    const aliasResult = runAlias(lower, args);
    if (aliasResult) {
        return aliasResult;
    }
    if (lower === "help") {
        const baseHelp = (0, commands_1.dispatchCommand)(state, command, args);
        const shortcuts = [
            "",
            "Portfolio shortcuts:",
            "  guide               Show quick navigation guide",
            "  home                Go to /home",
            "  projects            Go to /projects and list items",
            "  project <slug>      Open project card",
            "  about               Open /about profile",
            "  cv                  Open /cv"
        ].join("\n");
        return {
            ...baseHelp,
            output: `${baseHelp.output}${shortcuts}`
        };
    }
    return (0, commands_1.dispatchCommand)(state, command, args);
};
const main = async () => {
    boot();
    const motd = (0, commands_1.dispatchCommand)(state, "open", ["/system/motd.txt"]);
    renderInfo(motd.output);
    const toHome = (0, commands_1.dispatchCommand)(state, "cd", ["/home"]);
    if (isErrorOutput(toHome.output)) {
        renderResult("cd", toHome.output);
    }
    while (true) {
        const input = await ask(getPrompt());
        const parsed = parseArgs(input);
        if (parsed.length === 0) {
            continue;
        }
        const [command, ...args] = parsed;
        const result = runCommandWithUx(command, args);
        renderResult(command.toLowerCase(), result.output);
        if (result.exit) {
            break;
        }
    }
    rl.close();
};
main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    node_process_1.stdout.write(`Fatal error: ${message}\n`);
    rl.close();
    process.exitCode = 1;
});
