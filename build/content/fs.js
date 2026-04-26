"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rootFs = void 0;
exports.rootFs = {
    kind: "dir",
    children: {
        home: {
            kind: "dir",
            children: {
                "identity.txt": {
                    kind: "file",
                    content: "wkd1973: builder, explorer, CLI-first developer."
                },
                "file name.txt": {
                    kind: "file",
                    content: "Quoted path parsing works."
                }
            }
        },
        projects: {
            kind: "dir",
            children: {
                "ascii-os.txt": {
                    kind: "file",
                    content: "ASCII-OS roadmap: kernel CLI first, UI later."
                }
            }
        },
        system: {
            kind: "dir",
            children: {
                "motd.txt": {
                    kind: "file",
                    content: "INITIALIZING ASCII-OS..."
                }
            }
        }
    }
};
