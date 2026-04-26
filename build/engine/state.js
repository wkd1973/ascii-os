"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setCwd = exports.getCwd = exports.createInitialState = void 0;
const fs_1 = require("../content/fs");
const loader_1 = require("../content/loader");
const createInitialState = () => ({
    root: (0, loader_1.loadRootFromDisk)() ?? fs_1.rootFs,
    cwd: "/"
});
exports.createInitialState = createInitialState;
const getCwd = (state) => state.cwd;
exports.getCwd = getCwd;
const setCwd = (state, cwd) => {
    state.cwd = cwd;
};
exports.setCwd = setCwd;
