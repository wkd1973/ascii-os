import { createServer } from "node:http";
import { createWebHandler } from "./handler";

const PORT = Number(process.env.PORT ?? "3000");

if (require.main === module) {
  const handler = createWebHandler();
  const server = createServer(handler);
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
