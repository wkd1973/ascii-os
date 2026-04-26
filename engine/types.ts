export type FileNode = {
  kind: "file";
  content: string;
};

export type DirectoryNode = {
  kind: "dir";
  children: Record<string, FsNode>;
};

export type FsNode = FileNode | DirectoryNode;
