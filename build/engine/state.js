"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setCwd = exports.getCwd = exports.toSerializableState = exports.createStatelessState = exports.createInitialState = exports.DEFAULT_CONFIG = void 0;
const fs_1 = require("../content/fs");
const loader_1 = require("../content/loader");
const path_1 = require("./path");
exports.DEFAULT_CONFIG = {
    screenMode: "cga",
    promptTemplate: "ascii-os:[$p]$g$s",
    theme: "default"
};
const parseConfig = (content) => {
    const config = { ...exports.DEFAULT_CONFIG };
    const lines = content.split("\n");
    for (const line of lines) {
        const [key, ...valueParts] = line.split("=");
        if (!key || valueParts.length === 0)
            continue;
        const value = valueParts.join("=").trim();
        const cleanKey = key.trim();
        if (cleanKey === "screenMode" && (value === "cga" || value === "ega" || value === "vga")) {
            config.screenMode = value;
        }
        else if (cleanKey === "promptTemplate") {
            config.promptTemplate = value;
        }
        else if (cleanKey === "theme") {
            config.theme = value;
        }
    }
    return config;
};
const createInitialState = () => {
    const diskRoot = (0, loader_1.loadRootFromDisk)();
    // eslint-disable-next-line no-console
    console.log(`[STATE] loadRootFromDisk success: ${!!diskRoot}`);
    const root = diskRoot ?? fs_1.rootFs;
    const configFile = (0, path_1.getFileAtPath)(root, "/system/config.txt");
    const config = configFile ? parseConfig(configFile.content) : { ...exports.DEFAULT_CONFIG };
    return {
        root,
        cwd: "/",
        config
    };
};
exports.createInitialState = createInitialState;
const createStatelessState = (serializable) => {
    const state = (0, exports.createInitialState)();
    state.cwd = serializable.cwd;
    state.config = serializable.config;
    return state;
};
exports.createStatelessState = createStatelessState;
const toSerializableState = (state) => ({
    cwd: state.cwd,
    config: state.config
});
exports.toSerializableState = toSerializableState;
const getCwd = (state) => state.cwd;
exports.getCwd = getCwd;
const setCwd = (state, cwd) => {
    state.cwd = cwd;
};
exports.setCwd = setCwd;
