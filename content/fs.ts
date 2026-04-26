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
