"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_readline_1 = __importDefault(require("node:readline"));
const node_process_1 = require("node:process");
const commands_1 = require("../engine/commands");
const state_1 = require("../engine/state");
const aliases_1 = require("./aliases");
const parser_1 = require("./parser");
let state = (0, state_1.createInitialState)();
const rl = node_readline_1.default.createInterface({
    input: node_process_1.stdin,
    output: node_process_1.stdout,
    historySize: 500
});
const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    blue: "\x1b[34m"
};
const getPrompt = () => `ascii-os:[${(0, state_1.getCwd)(state)}]> `;
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
const clearScreen = () => {
    node_process_1.stdout.write("\x1bc");
};
const main = async () => {
    let activeScreenMode = (0, aliases_1.getScreenMode)(state);
    const bootSession = () => {
        state = (0, state_1.createInitialState)();
        (0, aliases_1.setScreenMode)(state, activeScreenMode);
        boot();
        const motd = (0, commands_1.dispatchCommand)(state, "open", ["/system/motd.txt"]);
        renderInfo(motd.output);
        const toHome = (0, commands_1.dispatchCommand)(state, "cd", ["/home"]);
        if (isErrorOutput(toHome.output)) {
            renderResult("cd", toHome.output);
        }
    };
    bootSession();
    rl.setPrompt(getPrompt());
    rl.prompt();
    rl.on("line", (input) => {
        const parsed = (0, parser_1.parseArgs)(input);
        if (parsed.length === 0) {
            rl.setPrompt(getPrompt());
            rl.prompt();
            return;
        }
        const [command, ...args] = parsed;
        const result = (0, aliases_1.runCliCommand)(state, command, args);
        if (result.screenMode) {
            activeScreenMode = result.screenMode;
        }
        if (result.clear) {
            clearScreen();
        }
        if (result.reboot) {
            bootSession();
        }
        if (!(result.clear && result.output.length === 0)) {
            renderResult(command.toLowerCase(), result.output);
        }
        if (result.exit) {
            rl.close();
            return;
        }
        rl.setPrompt(getPrompt());
        rl.prompt();
    });
};
main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    node_process_1.stdout.write(`Fatal error: ${message}\n`);
    rl.close();
    process.exitCode = 1;
});
