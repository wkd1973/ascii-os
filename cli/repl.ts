import readline from "node:readline";
import { stdin, stdout } from "node:process";
import { dispatchCommand } from "../engine/commands";
import { createInitialState, getCwd, type SystemState } from "../engine/state";
import { runCliCommand } from "./aliases";
import { parseArgs } from "./parser";

let state: SystemState = createInitialState();
const rl = readline.createInterface({
  input: stdin,
  output: stdout,
  historySize: 500
});

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  blue: "\x1b[34m"
} as const;

const getPrompt = (): string => `ascii-os:[${getCwd(state)}]> `;

const boot = (): void => {
  stdout.write("BOOTING ASCII-OS PORTFOLIO...\n");
  stdout.write("LOADING CONTENT FROM /content/data...\n");
  stdout.write("INITIALIZING USER SESSION...\n");
  stdout.write("WELCOME, OPERATOR\n\n");
};

const isErrorOutput = (output: string): boolean =>
  /^(Unknown command:|ls:|cd:|open:)/.test(output);

const isInfoOutput = (command: string): boolean =>
  command === "help" || command === "exit" || command === "quit" || command === "guide";

const colorize = (color: string, text: string): string => `${color}${text}${colors.reset}`;

const renderInfo = (output: string): void => {
  if (output.length === 0) {
    return;
  }

  stdout.write(`${colorize(colors.blue, "[INFO]")} ${output}\n\n`);
};

const renderResult = (command: string, output: string): void => {
  if (output.length === 0) {
    stdout.write(`${colorize(colors.green, "[OK]")} Command executed.\n\n`);
    return;
  }

  if (isErrorOutput(output)) {
    stdout.write(`${colorize(colors.red, "[ERR]")} ${output}\n\n`);
    return;
  }

  if (isInfoOutput(command)) {
    stdout.write(`${colorize(colors.blue, "[INFO]")} ${output}\n\n`);
    return;
  }

  stdout.write(`${colorize(colors.green, "[OK]")} ${output}\n\n`);
};

const clearScreen = (): void => {
  stdout.write("\x1bc");
};

const main = async (): Promise<void> => {
  const bootSession = (): void => {
    state = createInitialState();
    boot();
    const motd = dispatchCommand(state, "open", ["/system/motd.txt"]);
    renderInfo(motd.output);

    const toHome = dispatchCommand(state, "cd", ["/home"]);
    if (isErrorOutput(toHome.output)) {
      renderResult("cd", toHome.output);
    }
  };

  bootSession();

  rl.setPrompt(getPrompt());
  rl.prompt();

  rl.on("line", (input) => {
    const parsed = parseArgs(input);
    if (parsed.length === 0) {
      rl.setPrompt(getPrompt());
      rl.prompt();
      return;
    }

    const [command, ...args] = parsed;
    const result = runCliCommand(state, command, args);
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

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  stdout.write(`Fatal error: ${message}\n`);
  rl.close();
  process.exitCode = 1;
});
