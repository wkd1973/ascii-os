import { dispatchCommand, type CommandResult } from "../engine/commands";
import type { SystemState } from "../engine/state";

export type ScreenMode = "cga" | "ega" | "vga";

const defaultScreenMode: ScreenMode = "cga";
const screenModeByState = new WeakMap<SystemState, ScreenMode>();

export const getScreenMode = (state: SystemState): ScreenMode =>
  screenModeByState.get(state) ?? defaultScreenMode;

export const setScreenMode = (state: SystemState, mode: ScreenMode): void => {
  screenModeByState.set(state, mode);
};

const isErrorOutput = (output: string): boolean => /^(Unknown command:|ls:|cd:|open:)/.test(output);

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

const runAlias = (state: SystemState, command: string, args: string[]): CommandResult | null => {
  if (args.length > 0 && (command === "cga" || command === "ega" || command === "vga" || command === "mode")) {
    return { output: `${command}: this alias does not accept arguments` };
  }

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

  if (command === "cls") {
    return dispatchCommand(state, "clear", []);
  }

  if (command === "cga") {
    return { output: "Display mode set to CGA 80x25.", screenMode: "cga" };
  }

  if (command === "ega") {
    return { output: "Display mode set to EGA 80x43.", screenMode: "ega" };
  }

  if (command === "vga") {
    return { output: "Display mode set to VGA 80x50.", screenMode: "vga" };
  }

  if (command === "mode") {
    const current = getScreenMode(state);
    const label = current.toUpperCase();
    const geometry = current === "cga" ? "80x25" : current === "ega" ? "80x43" : "80x50";
    return { output: `Display mode: ${label} ${geometry}.`, screenMode: current };
  }

  return null;
};

export const runCliCommand = (state: SystemState, command: string, args: string[]): CommandResult => {
  const lower = command.toLowerCase();
  const aliasResult = runAlias(state, lower, args);
  if (aliasResult) {
    if (aliasResult.screenMode) {
      setScreenMode(state, aliasResult.screenMode);
    }
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
      "  cv                  Open /cv",
      "",
      "Display modes:",
      "  cga                 Set screen to 80x25",
      "  ega                 Set screen to 80x43",
      "  vga                 Set screen to 80x50",
      "  mode                Show current display mode"
    ].join("\n");

    return {
      ...baseHelp,
      output: `${baseHelp.output}${shortcuts}`
    };
  }

  return dispatchCommand(state, command, args);
};
