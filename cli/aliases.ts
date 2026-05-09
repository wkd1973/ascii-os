import { dispatchCommand, type CommandResult } from "../engine/commands";
import { getDirectoryAtPath } from "../engine/path";
import type { SystemState } from "../engine/state";
import type { DirectoryNode } from "../engine/types";

export type ScreenMode = "cga" | "ega" | "vga";

const defaultScreenMode: ScreenMode = "cga";
const screenModeByState = new WeakMap<SystemState, ScreenMode>();
const defaultPromptTemplate = "ascii-os:[$p]$g$s";
const promptTemplateByState = new WeakMap<SystemState, string>();

export const getScreenMode = (state: SystemState): ScreenMode =>
  screenModeByState.get(state) ?? defaultScreenMode;

export const setScreenMode = (state: SystemState, mode: ScreenMode): void => {
  screenModeByState.set(state, mode);
};

export const getPromptTemplate = (state: SystemState): string =>
  promptTemplateByState.get(state) ?? defaultPromptTemplate;

export const setPromptTemplate = (state: SystemState, template: string): void => {
  promptTemplateByState.set(state, template);
};

export const renderPrompt = (state: SystemState): string =>
  getPromptTemplate(state)
    .replace(/\$p/gi, state.cwd)
    .replace(/\$g/gi, ">")
    .replace(/\$l/gi, "<")
    .replace(/\$b/gi, "|")
    .replace(/\$s/gi, " ");

const isErrorOutput = (output: string): boolean => /^(Unknown command:|ls:|cd:|open:)/.test(output);

const getProjectSlugs = (state: SystemState): string[] => {
  const projects = getDirectoryAtPath(state.root, "/projects");
  if (!projects) {
    return [];
  }

  return Object.entries(projects.children)
    .filter(([, node]) => node.kind === "dir" && hasIndexFile(node))
    .map(([name]) => name)
    .sort((a, b) => a.localeCompare(b));
};

const hasIndexFile = (directory: DirectoryNode): boolean =>
  directory.children["index.txt"]?.kind === "file";

const formatProjectsOverview = (state: SystemState): string => {
  const slugs = getProjectSlugs(state);
  const cards = slugs.length === 0 ? "- (empty)" : slugs.map((slug) => `- ${slug}`).join("\n");

  return [
    "PROJECTS OVERVIEW",
    "",
    "The project cards below are loaded from /projects.",
    "",
    "Available project cards:",
    cards,
    "",
    "Recommended flow:",
    "1. Open a card with `project <slug>`",
    "2. Fill in `Stack`, `Role`, `Zakres odpowiedzialności`, `Uwagi`, and `Link`",
    "3. Keep descriptions short and factual"
  ].join("\n");
};

const formatGuideProjectSlugs = (state: SystemState): string[] => {
  const slugs = getProjectSlugs(state);
  if (slugs.length === 0) {
    return ["  (empty)"];
  }

  return slugs.map((slug) => `  ${slug}`);
};

const runAlias = (state: SystemState, command: string, args: string[]): CommandResult | null => {
  if (
    args.length > 0 &&
    (command === "cga" ||
      command === "ega" ||
      command === "vga" ||
      command === "mode" ||
      command === "ver" ||
      command === "date" ||
      command === "time" ||
      command === "shutdown" ||
      command === "whoami")
  ) {
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

    return { output: formatProjectsOverview(state) };
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
        "  projects            Open projects overview",
        "  project <slug>      Open project card",
        "  about               Open profile",
        "  cv                  Open CV summary",
        "",
        "Project cards:",
        ...formatGuideProjectSlugs(state),
        "",
        "Project card format:",
        "  Name                Project title",
        "  Description         Short project summary",
        "  Domain              Business domain",
        "  Status              Current label/state",
        "  Role                Your role in the project",
        "  Stack               Tech stack, fill manually",
        "  Zakres odpowiedzialności  Responsibilities, fill manually",
        "  Uwagi               Extra notes, fill manually",
        "  Link                Reference or local link",
        "",
        "Explore manually:",
        "  projects",
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

  if (command === "dir") {
    return dispatchCommand(state, "ls", args);
  }

  if (command === "type") {
    return dispatchCommand(state, "cat", args);
  }

  if (command === "cls") {
    return dispatchCommand(state, "clear", []);
  }

  if (command === "shutdown") {
    return dispatchCommand(state, "shutdown", []);
  }

  if (command === "whoami") {
    return { output: "wkd1973" };
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

  if (command === "ver") {
    return { output: "ASCII-OS version 0.1.0" };
  }

  if (command === "date") {
    const now = new Date();
    const yyyy = String(now.getUTCFullYear());
    const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(now.getUTCDate()).padStart(2, "0");
    return { output: `${yyyy}-${mm}-${dd} UTC` };
  }

  if (command === "time") {
    const now = new Date();
    const hh = String(now.getUTCHours()).padStart(2, "0");
    const mm = String(now.getUTCMinutes()).padStart(2, "0");
    const ss = String(now.getUTCSeconds()).padStart(2, "0");
    return { output: `${hh}:${mm}:${ss} UTC` };
  }

  if (command === "prompt") {
    if (args.length === 0) {
      return { output: `Prompt template: ${getPromptTemplate(state)}` };
    }

    const template = args.join(" ");
    if (template.toLowerCase() === "default") {
      setPromptTemplate(state, defaultPromptTemplate);
      return { output: `Prompt template set to ${defaultPromptTemplate}` };
    }

    setPromptTemplate(state, template);
    return { output: `Prompt template set to ${template}` };
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
      "DOS-style commands:",
      "  dir [path]          Alias for ls",
      "  type <path>         Alias for cat",
      "  ver                 Show ASCII-OS version",
      "  date                Show current UTC date",
      "  time                Show current UTC time",
      "  whoami              Show current user",
      "  cls                 Alias for clear",
      "  shutdown            Shut down ASCII-OS",
      "",
      "Display modes:",
      "  cga                 Set screen to 80x25",
      "  ega                 Set screen to 80x43",
      "  vga                 Set screen to 80x50",
      "  mode                Show current display mode",
      "",
      "Prompt:",
      "  prompt              Show current prompt template",
      "  prompt <template>   Set prompt template",
      "  prompt default      Restore default prompt"
    ].join("\n");

    return {
      ...baseHelp,
      output: `${baseHelp.output}${shortcuts}`
    };
  }

  return dispatchCommand(state, command, args);
};
