"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBaseName = exports.getFileAtPath = exports.getDirectoryAtPath = exports.getNodeAtPath = exports.normalizePath = void 0;
const splitPath = (path) => path.split("/").filter(Boolean);
const normalizePath = (cwd, inputPath) => {
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
exports.normalizePath = normalizePath;
const getNodeAtPath = (root, absolutePath) => {
    if (absolutePath === "/") {
        return root;
    }
    let current = root;
    for (const segment of splitPath(absolutePath)) {
        if (current.kind !== "dir") {
            return null;
        }
        const next = current.children[segment];
        if (!next) {
            return null;
        }
        current = next;
    }
    return current;
};
exports.getNodeAtPath = getNodeAtPath;
const getDirectoryAtPath = (root, absolutePath) => {
    const node = (0, exports.getNodeAtPath)(root, absolutePath);
    return node?.kind === "dir" ? node : null;
};
exports.getDirectoryAtPath = getDirectoryAtPath;
const getFileAtPath = (root, absolutePath) => {
    const node = (0, exports.getNodeAtPath)(root, absolutePath);
    return node?.kind === "file" ? node : null;
};
exports.getFileAtPath = getFileAtPath;
const getBaseName = (absolutePath) => {
    if (absolutePath === "/") {
        return "/";
    }
    const parts = splitPath(absolutePath);
    return parts[parts.length - 1];
};
exports.getBaseName = getBaseName;
