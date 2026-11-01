import "dotenv/config";
import http from "node:http";
import { app } from "./app.js";
import { startFeedManager } from "./feeds/feed-manager.js";
import { startTickProcessor } from "./modules/trading/tick-processor.js";
import { startWebSocketServer } from "./ws/server.js";

const port = Number(process.env.PORT ?? 4000);
const httpServer = http.createServer(app);

async function main() {
  await startFeedManager();
  await startTickProcessor();
  await startWebSocketServer(httpServer);

  httpServer.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error("Failed to start backend", err);
  process.exit(1);
});
