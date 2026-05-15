import { rootFs } from "../content/fs";
import { loadRootFromDisk } from "../content/loader";
import { getFileAtPath } from "./path";
import type { DirectoryNode } from "./types";

export type ScreenMode = "cga" | "ega" | "vga";

export type SystemConfig = {
  screenMode: ScreenMode;
  promptTemplate: string;
  theme: string;
};

export type SystemState = {
  root: DirectoryNode;
  cwd: string;
  config: SystemConfig;
};

export const DEFAULT_CONFIG: SystemConfig = {
  screenMode: "cga",
  promptTemplate: "ascii-os:[$p]$g$s",
  theme: "default"
};

const parseConfig = (content: string): SystemConfig => {
  const config = { ...DEFAULT_CONFIG };
  const lines = content.split("\n");

  for (const line of lines) {
    const [key, ...valueParts] = line.split("=");
    if (!key || valueParts.length === 0) continue;

    const value = valueParts.join("=").trim();
    const cleanKey = key.trim();

    if (cleanKey === "screenMode" && (value === "cga" || value === "ega" || value === "vga")) {
      config.screenMode = value;
    } else if (cleanKey === "promptTemplate") {
      config.promptTemplate = value;
    } else if (cleanKey === "theme") {
      config.theme = value;
    }
  }

  return config;
};

export const createInitialState = (): SystemState => {
  const diskRoot = loadRootFromDisk();
  // eslint-disable-next-line no-console
  console.log(`[STATE] loadRootFromDisk success: ${!!diskRoot}`);
  const root = diskRoot ?? rootFs;

  const configFile = getFileAtPath(root, "/system/config.txt");
  const config = configFile ? parseConfig(configFile.content) : { ...DEFAULT_CONFIG };

  return {
    root,
    cwd: "/",
    config
  };
};

export const getCwd = (state: SystemState): string => state.cwd;

export const setCwd = (state: SystemState, cwd: string): void => {
  state.cwd = cwd;
};
