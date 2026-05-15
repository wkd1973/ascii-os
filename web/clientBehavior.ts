export type HistoryDirection = "up" | "down";

export type CommandHistoryState = {
  entries: string[];
  index: number;
};

export type WebCommandResponse = {
  clear?: boolean;
  reboot?: boolean;
  rebootLines?: string[];
  screenMode?: string | null;
  theme?: string | null;
  output?: string;
  prompt?: string;
  exit?: boolean;
  animate?: boolean;
  aocMode?: boolean;
};

export type RenderAction =
  | { type: "clear" }
  | { type: "reboot"; lines: string[] }
  | { type: "append"; text: string; animate?: boolean }
  | { type: "appendHelp"; text: string }
  | { type: "screenMode"; mode: string }
  | { type: "theme"; theme: string }
  | { type: "prompt"; text: string }
  | { type: "disableInput" }
  | { type: "aocMode" };

export type StoredWebSession = {
  sessionId: string;
  history: string[];
};

const STORAGE_VERSION = 1;

export const createCommandHistory = (): CommandHistoryState => ({
  entries: [],
  index: 0
});

export const addCommandToHistory = (state: CommandHistoryState, command: string): CommandHistoryState => {
  const entries = [...state.entries, command];
  return {
    entries,
    index: entries.length
  };
};

export const navigateCommandHistory = (
  state: CommandHistoryState,
  direction: HistoryDirection
): { state: CommandHistoryState; value: string } => {
  if (state.entries.length === 0) {
    return { state, value: "" };
  }

  const index =
    direction === "up"
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

export const getScreenModeClass = (mode: string): string => {
  if (mode === "ega") {
    return "mode-ega";
  }
  if (mode === "vga") {
    return "mode-vga";
  }
  return "mode-cga";
};

export const shouldRenderHelpPanel = (command: string): boolean => command.trim().toLowerCase() === "help";

export const serializeStoredWebSession = (sessionId: string, history: string[]): string =>
  JSON.stringify({
    version: STORAGE_VERSION,
    sessionId,
    history
  });

export const parseStoredWebSession = (raw: string | null): StoredWebSession | null => {
  if (!raw) {
    return null;
  }

  try {
    const data: Record<string, unknown> = JSON.parse(raw);
    if (data.version !== STORAGE_VERSION) {
      return null;
    }

    const sessionId = typeof data.sessionId === "string" ? data.sessionId : "";
    const history = Array.isArray(data.history) ? data.history.filter((entry) => typeof entry === "string") : [];
    if (!sessionId) {
      return null;
    }

    return { sessionId, history };
  } catch {
    return null;
  }
};

export const planCommandResponseRender = (command: string, response: WebCommandResponse): RenderAction[] => {
  const actions: RenderAction[] = [];

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
    const action: RenderAction = shouldRenderHelpPanel(command)
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
