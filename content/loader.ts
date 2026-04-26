import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { DirectoryNode, FsNode } from "../engine/types";

const contentRootPath = path.resolve(process.cwd(), "content", "data");

const readNode = (absolutePath: string): FsNode => {
  const statEntries = readdirSync(absolutePath, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const children: Record<string, FsNode> = {};

  for (const entry of statEntries) {
    const fullPath = path.join(absolutePath, entry.name);
    if (entry.isDirectory()) {
      children[entry.name] = readNode(fullPath);
      continue;
    }

    if (entry.isFile()) {
      children[entry.name] = {
        kind: "file",
        content: readFileSync(fullPath, "utf8")
      };
    }
  }

  return {
    kind: "dir",
    children
  };
};

export const loadRootFromDisk = (): DirectoryNode | null => {
  if (!existsSync(contentRootPath)) {
    return null;
  }

  const node = readNode(contentRootPath);
  return node.kind === "dir" ? node : null;
};
