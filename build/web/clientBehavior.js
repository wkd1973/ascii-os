"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.planCommandResponseRender = exports.parseStoredWebSession = exports.serializeStoredWebSession = exports.shouldRenderHelpPanel = exports.getScreenModeClass = exports.navigateCommandHistory = exports.addCommandToHistory = exports.createCommandHistory = void 0;
const STORAGE_VERSION = 1;
const createCommandHistory = () => ({
    entries: [],
    index: 0
});
exports.createCommandHistory = createCommandHistory;
const addCommandToHistory = (state, command) => {
    const entries = [...state.entries, command];
    return {
        entries,
        index: entries.length
    };
};
exports.addCommandToHistory = addCommandToHistory;
const navigateCommandHistory = (state, direction) => {
    if (state.entries.length === 0) {
        return { state, value: "" };
    }
    const index = direction === "up"
        ? Math.max(0, state.index - 1)
        : Math.min(state.entries.length, state.index + 1);
    return {
        state: {
            entries: state.entries,
            index
        },
        value: index === state.entries.length ? "" : state.entries[index]
    };
};
exports.navigateCommandHistory = navigateCommandHistory;
const getScreenModeClass = (mode) => {
    if (mode === "ega") {
        return "mode-ega";
    }
    if (mode === "vga") {
        return "mode-vga";
    }
    return "mode-cga";
};
exports.getScreenModeClass = getScreenModeClass;
const shouldRenderHelpPanel = (command) => command.trim().toLowerCase() === "help";
exports.shouldRenderHelpPanel = shouldRenderHelpPanel;
const serializeStoredWebSession = (sessionId, history) => JSON.stringify({
    version: STORAGE_VERSION,
    sessionId,
    history
});
exports.serializeStoredWebSession = serializeStoredWebSession;
const parseStoredWebSession = (raw) => {
    if (!raw) {
        return null;
    }
    try {
        const data = JSON.parse(raw);
        if (data.version !== STORAGE_VERSION) {
            return null;
        }
        const sessionId = typeof data.sessionId === "string" ? data.sessionId : "";
        const history = Array.isArray(data.history) ? data.history.filter((entry) => typeof entry === "string") : [];
        if (!sessionId) {
            return null;
        }
        return { sessionId, history };
    }
    catch {
        return null;
    }
};
exports.parseStoredWebSession = parseStoredWebSession;
const planCommandResponseRender = (command, response) => {
    const actions = [];
    if (response.clear) {
        actions.push({ type: "clear" });
    }
    if (response.reboot && Array.isArray(response.rebootLines)) {
        actions.push({ type: "reboot", lines: response.rebootLines });
    }
    if (response.aocMode) {
        actions.push({ type: "aocMode" });
    }
    if (response.screenMode) {
        actions.push({ type: "screenMode", mode: response.screenMode });
    }
    if (response.theme) {
        actions.push({ type: "theme", theme: response.theme });
    }
    if (response.output) {
        const action = (0, exports.shouldRenderHelpPanel)(command)
            ? { type: "appendHelp", text: response.output }
            : { type: "append", text: response.output };
        if (action.type === "append" && response.animate) {
            action.animate = true;
        }
        actions.push(action);
    }
    if (!response.clear) {
        actions.push({ type: "append", text: "" });
    }
    if (typeof response.prompt === "string") {
        actions.push({ type: "prompt", text: response.prompt });
    }
    if (response.exit) {
        actions.push({ type: "disableInput" });
    }
    return actions;
};
exports.planCommandResponseRender = planCommandResponseRender;
