const test = require("node:test");
const assert = require("node:assert/strict");

const { createWebServer } = require("../build/web/server.js");

const postJson = (port, path, payload) =>
  new Promise((resolve, reject) => {
    const body = JSON.stringify(payload ?? {});
    const req = require("node:http").request(
      {
        method: "POST",
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
          resolve(JSON.parse(raw));
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });

const withServer = async (fn) => {
  const server = createWebServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;

  try {
    await fn(port);
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
};

test("web api returns screen mode changes for mode aliases", async () => {
  await withServer(async (port) => {
    const init = await postJson(port, "/api/init", {});
    assert.equal(init.screenMode, "cga");

    const toEga = await postJson(port, "/api/command", { sessionId: init.sessionId, input: "ega" });
    assert.equal(toEga.screenMode, "ega");

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
