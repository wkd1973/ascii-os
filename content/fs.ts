import type { DirectoryNode } from "../engine/types";

export const rootFs: DirectoryNode = {
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
    logs: {
      kind: "dir",
      children: {
        "log-2026-05-10-init.txt": {
          kind: "file",
          content: "SYSTEM LOG: INITIALIZATION\nDATE: 2026-05-10 10:00:00\nSTATUS: OK\n\nASCII-OS Kernel v1.0 initialized."
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
