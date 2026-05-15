const test = require("node:test");
const assert = require("node:assert/strict");
const { createWebServer } = require("../build/web/server.js");

const withServer = async (fn) => {
  const server = createWebServer({ now: () => Date.now() });
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  try {
    await fn(port);
  } finally {
    server.close();
  }
};

const post = (port, url, body) =>
  fetch(`http://localhost:${port}${url}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  }).then((res) => res.json());

test("web api /api/aoc returns directory listing", async () => {
  await withServer(async (port) => {
    const { sessionId } = await post(port, "/api/init", {});

    const list = await post(port, "/api/aoc", { sessionId, action: "list", path: "/home" });
    assert.ok(Array.isArray(list.entries));
    assert.ok(list.entries.some(e => e.name === "identity.txt"));
    assert.ok(list.entries.some(e => e.name === ".."));
  });
});

test("web api /api/aoc returns preview for file and directory", async () => {
  await withServer(async (port) => {
    const { sessionId } = await post(port, "/api/init", {});

    const filePreview = await post(port, "/api/aoc", { 
      sessionId, 
      action: "preview", 
      itemPath: "/home/identity.txt" 
    });
    assert.ok(filePreview.preview.includes("wkd1973"));

    const dirPreview = await post(port, "/api/aoc", { 
      sessionId, 
      action: "preview", 
      itemPath: "/projects" 
    });
    assert.ok(dirPreview.preview.includes("ascii-os/"));
  });
});
