const test = require("node:test");
const assert = require("node:assert/strict");

const { createWebServer } = require("../build/web/server.js");

const requestJson = (port, method, path, payload) =>
  new Promise((resolve, reject) => {
    const body = payload === undefined ? "" : JSON.stringify(payload ?? {});
    const req = require("node:http").request(
      {
        method,
        hostname: "127.0.0.1",
        port,
        path,
        headers: {
          "content-type": "application/json",
          "content-length": Buffer.byteLength(body)
        }
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8");
          resolve({
            statusCode: res.statusCode,
            body: raw ? JSON.parse(raw) : null
          });
        });
      }
    );
    req.on("error", reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });

const postJson = async (port, path, payload) => {
  const response = await requestJson(port, "POST", path, payload);
  return response.body;
};

const getJson = async (port, path) => {
  const response = await requestJson(port, "GET", path);
  return response.body;
};

const getText = (port, path) =>
  new Promise((resolve, reject) => {
    const req = require("node:http").request(
      {
        method: "GET",
        hostname: "127.0.0.1",
        port,
        path
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode,
            contentType: res.headers["content-type"],
            body: Buffer.concat(chunks).toString("utf8")
          });
        });
      }
    );
    req.on("error", reject);
    req.end();
  });

const withServer = async (fn, options) => {
  const server = createWebServer(options);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;

  try {
    await fn(port);
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
};

test("web root returns terminal html shell", async () => {
  await withServer(async (port) => {
    const page = await getText(port, "/");

    assert.equal(page.statusCode, 200);
    assert.equal(page.contentType, "text/html; charset=utf-8");
    assert.ok(page.body.includes('<span>ascii-os:web</span>'));
    assert.ok(page.body.includes("<style>"));
    assert.ok(page.body.includes("<script>"));
    assert.ok(page.body.includes('post("/api/init")'));
    assert.equal(page.body.includes("exports."), false);
  });
});

test("web health endpoint reports ok and session count", async () => {
  await withServer(async (port) => {
    const empty = await getJson(port, "/health");
    assert.equal(empty.status, "ok");
    assert.equal(empty.sessions, 0);
    assert.equal(typeof empty.sessionTtlMs, "number");

    await postJson(port, "/api/init", {});
    const withSession = await getJson(port, "/health");
    assert.equal(withSession.status, "ok");
    assert.equal(withSession.sessions, 1);
  });
});

test("web api expires inactive sessions after ttl", async () => {
  let currentTime = 1000;

  await withServer(
    async (port) => {
      const init = await postJson(port, "/api/init", {});

      currentTime = 1049;
      const active = await postJson(port, "/api/command", { sessionId: init.sessionId, input: "pwd" });
      assert.equal(active.output, "/home");

      currentTime = 1100;
      const expired = await requestJson(port, "POST", "/api/command", { sessionId: init.sessionId, input: "pwd" });
      assert.equal(expired.statusCode, 400);
      assert.equal(expired.body.error, "Invalid session");

      const health = await getJson(port, "/health");
      assert.equal(health.sessions, 0);
    },
    { sessionTtlMs: 50, now: () => currentTime }
  );
});

test("web api returns screen mode changes for mode aliases", async () => {
  await withServer(async (port) => {
    const init = await postJson(port, "/api/init", {});
    assert.equal(init.screenMode, "cga");

    const toEga = await postJson(port, "/api/command", { sessionId: init.sessionId, input: "ega" });
    assert.equal(toEga.screenMode, "ega");

    const restore = await postJson(port, "/api/command", { sessionId: init.sessionId, input: "" });
    assert.equal(restore.screenMode, "ega");

    const mode = await postJson(port, "/api/command", { sessionId: init.sessionId, input: "mode" });
    assert.equal(mode.screenMode, "ega");
    assert.equal(mode.output, "Display mode: EGA 80x43.");
  });
});

test("web reboot preserves selected screen mode", async () => {
  await withServer(async (port) => {
    const init = await postJson(port, "/api/init", {});
    await postJson(port, "/api/command", { sessionId: init.sessionId, input: "vga" });
    const reboot = await postJson(port, "/api/command", { sessionId: init.sessionId, input: "reboot" });
    const mode = await postJson(port, "/api/command", { sessionId: init.sessionId, input: "mode" });

    assert.equal(reboot.reboot, true);
    assert.equal(reboot.clear, true);
    assert.equal(reboot.screenMode, "vga");
    assert.ok(Array.isArray(reboot.rebootLines));
    assert.ok(reboot.rebootLines.length > 0);
    assert.equal(mode.output, "Display mode: VGA 80x50.");
  });
});

test("web prompt command updates and preserves prompt across reboot", async () => {
  await withServer(async (port) => {
    const init = await postJson(port, "/api/init", {});
    const changed = await postJson(port, "/api/command", { sessionId: init.sessionId, input: "prompt [$p]$g" });
    const reboot = await postJson(port, "/api/command", { sessionId: init.sessionId, input: "reboot" });
    const current = await postJson(port, "/api/command", { sessionId: init.sessionId, input: "prompt" });

    assert.equal(init.prompt, "ascii-os:[/home]> ");
    assert.equal(changed.prompt, "[/home]>");
    assert.equal(reboot.prompt, "[/home]>");
    assert.equal(current.output, "Prompt template: [$p]$g");
  });
});

test("web help output uses grouped command sections", async () => {
  await withServer(async (port) => {
    const init = await postJson(port, "/api/init", {});
    const help = await postJson(port, "/api/command", { sessionId: init.sessionId, input: "help" });

    assert.ok(help.output.includes("Core filesystem commands:"));
    assert.ok(help.output.includes("Session commands:"));
    assert.ok(help.output.includes("Portfolio shortcuts:"));
    assert.ok(help.output.includes("DOS-style commands:"));
    assert.ok(help.output.includes("Display modes:"));
    assert.ok(help.output.includes("Prompt:"));
  });
});
