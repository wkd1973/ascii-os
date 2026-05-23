"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_http_1 = require("node:http");
const handler_1 = require("./handler");
const PORT = Number(process.env.PORT ?? "3000");
if (require.main === module) {
    const handler = (0, handler_1.createWebHandler)();
    const server = (0, node_http_1.createServer)(handler);
    server.listen(PORT, () => {
        // eslint-disable-next-line no-console
        console.log("========================================");
        // eslint-disable-next-line no-console
        console.log(`ASCII-OS WEB SERVER STARTING ON PORT ${PORT}`);
        // eslint-disable-next-line no-console
        console.log("LOCAL DEVELOPMENT MODE");
        // eslint-disable-next-line no-console
        console.log("========================================");
    });
}
