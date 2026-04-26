import type { DirectoryNode, FileNode, FsNode } from "./types";

const splitPath = (path: string): string[] => path.split("/").filter(Boolean);

export const normalizePath = (cwd: string, inputPath: string): string => {
  const initial = inputPath.startsWith("/") ? [] : splitPath(cwd);
  const segments = splitPath(inputPath);
  const result = [...initial];

  for (const segment of segments) {
    if (segment === "." || segment === "") {
      continue;
    }

    if (segment === "..") {
      result.pop();
      continue;
    }

    result.push(segment);
  }

  return result.length > 0 ? `/${result.join("/")}` : "/";
};

export const getNodeAtPath = (root: DirectoryNode, absolutePath: string): FsNode | null => {
  if (absolutePath === "/") {
    return root;
  }

  let current: FsNode = root;
  for (const segment of splitPath(absolutePath)) {
    if (current.kind !== "dir") {
      return null;
    }

    const next: FsNode | undefined = current.children[segment];
    if (!next) {
      return null;
    }

    current = next;
  }

  return current;
};

export const getDirectoryAtPath = (root: DirectoryNode, absolutePath: string): DirectoryNode | null => {
  const node = getNodeAtPath(root, absolutePath);
  return node?.kind === "dir" ? node : null;
};

export const getFileAtPath = (root: DirectoryNode, absolutePath: string): FileNode | null => {
  const node = getNodeAtPath(root, absolutePath);
  return node?.kind === "file" ? node : null;
};

export const getBaseName = (absolutePath: string): string => {
  if (absolutePath === "/") {
    return "/";
  }

  const parts = splitPath(absolutePath);
  return parts[parts.length - 1];
};
