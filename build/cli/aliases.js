"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCliCommand = exports.renderPrompt = exports.setPromptTemplate = exports.getPromptTemplate = exports.setScreenMode = exports.getScreenMode = void 0;
const commands_1 = require("../engine/commands");
const path_1 = require("../engine/path");
const defaultScreenMode = "cga";
const screenModeByState = new WeakMap();
const defaultPromptTemplate = "ascii-os:[$p]$g$s";
const promptTemplateByState = new WeakMap();
const getScreenMode = (state) => screenModeByState.get(state) ?? defaultScreenMode;
exports.getScreenMode = getScreenMode;
const setScreenMode = (state, mode) => {
    screenModeByState.set(state, mode);
};
exports.setScreenMode = setScreenMode;
const getPromptTemplate = (state) => promptTemplateByState.get(state) ?? defaultPromptTemplate;
exports.getPromptTemplate = getPromptTemplate;
const setPromptTemplate = (state, template) => {
    promptTemplateByState.set(state, template);
};
exports.setPromptTemplate = setPromptTemplate;
const renderPrompt = (state) => (0, exports.getPromptTemplate)(state)
    .replace(/\$p/gi, state.cwd)
    .replace(/\$g/gi, ">")
    .replace(/\$l/gi, "<")
    .replace(/\$b/gi, "|")
    .replace(/\$s/gi, " ");
exports.renderPrompt = renderPrompt;
const isErrorOutput = (output) => /^(Unknown command:|ls:|cd:|open:)/.test(output);
const getProjectSlugs = (state) => {
    const projects = (0, path_1.getDirectoryAtPath)(state.root, "/projects");
    if (!projects) {
        return [];
    }
    return Object.entries(projects.children)
        .filter(([, node]) => node.kind === "dir" && hasIndexFile(node))
        .map(([name]) => name)
        .sort((a, b) => a.localeCompare(b));
};
const hasIndexFile = (directory) => directory.children["index.txt"]?.kind === "file";
const formatProjectsOverview = (state) => {
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
const formatGuideProjectSlugs = (state) => {
    const slugs = getProjectSlugs(state);
    if (slugs.length === 0) {
        return ["  (empty)"];
    }
    return slugs.map((slug) => `  ${slug}`);
};
const runAlias = (state, command, args) => {
    if (args.length > 0 &&
        (command === "cga" ||
            command === "ega" ||
            command === "vga" ||
            command === "mode" ||
            command === "ver" ||
            command === "date" ||
            command === "time" ||
            command === "shutdown" ||
            command === "whoami")) {
        return { output: `${command}: this alias does not accept arguments` };
    }
    if (command === "home") {
        return (0, commands_1.dispatchCommand)(state, "cd", ["/home"]);
    }
    if (command === "projects") {
        const move = (0, commands_1.dispatchCommand)(state, "cd", ["/projects"]);
        if (isErrorOutput(move.output)) {
            return move;
        }
        return { output: formatProjectsOverview(state) };
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
        const move = (0, commands_1.dispatchCommand)(state, "cd", ["/projects"]);
        if (isErrorOutput(move.output)) {
            return move;
        }
        return (0, commands_1.dispatchCommand)(state, "open", [`${slug}/index.txt`]);
    }
    if (command === "dir") {
        return (0, commands_1.dispatchCommand)(state, "ls", args);
    }
    if (command === "type") {
        return (0, commands_1.dispatchCommand)(state, "cat", args);
    }
    if (command === "cls") {
        return (0, commands_1.dispatchCommand)(state, "clear", []);
    }
    if (command === "shutdown") {
        return (0, commands_1.dispatchCommand)(state, "shutdown", []);
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
        const current = (0, exports.getScreenMode)(state);
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
            return { output: `Prompt template: ${(0, exports.getPromptTemplate)(state)}` };
        }
        const template = args.join(" ");
        if (template.toLowerCase() === "default") {
            (0, exports.setPromptTemplate)(state, defaultPromptTemplate);
            return { output: `Prompt template set to ${defaultPromptTemplate}` };
        }
        (0, exports.setPromptTemplate)(state, template);
        return { output: `Prompt template set to ${template}` };
    }
    return null;
};
const runCliCommand = (state, command, args) => {
    const lower = command.toLowerCase();
    const aliasResult = runAlias(state, lower, args);
    if (aliasResult) {
        if (aliasResult.screenMode) {
            (0, exports.setScreenMode)(state, aliasResult.screenMode);
        }
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
    return (0, commands_1.dispatchCommand)(state, command, args);
};
exports.runCliCommand = runCliCommand;
