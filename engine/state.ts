import { rootFs } from "../content/fs";
import { loadRootFromDisk } from "../content/loader";
import type { DirectoryNode } from "./types";

export type SystemState = {
  root: DirectoryNode;
  cwd: string;
};

export const createInitialState = (): SystemState => ({
  root: loadRootFromDisk() ?? rootFs,
  cwd: "/"
});

export const getCwd = (state: SystemState): string => state.cwd;

export const setCwd = (state: SystemState, cwd: string): void => {
  state.cwd = cwd;
};
