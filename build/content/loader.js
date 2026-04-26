"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadRootFromDisk = void 0;
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const contentRootPath = node_path_1.default.resolve(process.cwd(), "content", "data");
const readNode = (absolutePath) => {
    const statEntries = (0, node_fs_1.readdirSync)(absolutePath, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    const children = {};
    for (const entry of statEntries) {
        const fullPath = node_path_1.default.join(absolutePath, entry.name);
        if (entry.isDirectory()) {
            children[entry.name] = readNode(fullPath);
            continue;
        }
        if (entry.isFile()) {
            children[entry.name] = {
                kind: "file",
                content: (0, node_fs_1.readFileSync)(fullPath, "utf8")
            };
        }
    }
    return {
        kind: "dir",
        children
    };
};
const loadRootFromDisk = () => {
    if (!(0, node_fs_1.existsSync)(contentRootPath)) {
        return null;
    }
    const node = readNode(contentRootPath);
    return node.kind === "dir" ? node : null;
};
exports.loadRootFromDisk = loadRootFromDisk;
