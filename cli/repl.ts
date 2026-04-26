import readline from "node:readline";
import { stdin, stdout } from "node:process";
import type { CommandResult } from "../engine/commands";
import { dispatchCommand } from "../engine/commands";
import { createInitialState, getCwd } from "../engine/state";

const state = createInitialState();
const rl = readline.createInterface({
  input: stdin,
  output: stdout
});

const ask = (prompt: string): Promise<string> =>
  new Promise((resolve) => {
    rl.question(prompt, resolve);
  });

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  blue: "\x1b[34m"
} as const;

const getPrompt = (): string => `ascii-os:[${getCwd(state)}]> `;

const parseArgs = (line: string): string[] => {
  const tokens: string[] = [];
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

const formatProjectsListing = (lsOutput: string): string => {
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

const runAlias = (command: string, args: string[]): CommandResult | null => {
  if (command === "home") {
    return dispatchCommand(state, "cd", ["/home"]);
  }

  if (command === "projects") {
    const move = dispatchCommand(state, "cd", ["/projects"]);
    if (isErrorOutput(move.output)) {
      return move;
    }

    const list = dispatchCommand(state, "ls", []);
    if (isErrorOutput(list.output)) {
      return list;
    }

    return {
      ...list,
      output: formatProjectsListing(list.output)
    };
  }

  if (command === "about") {
    const move = dispatchCommand(state, "cd", ["/about"]);
    if (isErrorOutput(move.output)) {
      return move;
    }

    return dispatchCommand(state, "open", ["index.txt"]);
  }

  if (command === "cv") {
    const move = dispatchCommand(state, "cd", ["/cv"]);
    if (isErrorOutput(move.output)) {
      return move;
    }

    return dispatchCommand(state, "open", ["index.txt"]);
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

    const move = dispatchCommand(state, "cd", ["/projects"]);
    if (isErrorOutput(move.output)) {
      return move;
    }

    return dispatchCommand(state, "open", [`${slug}/index.txt`]);
  }

  return null;
};

const runCommandWithUx = (command: string, args: string[]): CommandResult => {
  const lower = command.toLowerCase();
  const aliasResult = runAlias(lower, args);
  if (aliasResult) {
    return aliasResult;
  }

  if (lower === "help") {
    const baseHelp = dispatchCommand(state, command, args);
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

  return dispatchCommand(state, command, args);
};

const main = async (): Promise<void> => {
  boot();
  const motd = dispatchCommand(state, "open", ["/system/motd.txt"]);
  renderInfo(motd.output);

  const toHome = dispatchCommand(state, "cd", ["/home"]);
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

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  stdout.write(`Fatal error: ${message}\n`);
  rl.close();
  process.exitCode = 1;
});
