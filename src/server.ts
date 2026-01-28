import { createApp } from "./app";
import { config } from "./config/env";
import { initDb } from "./config/db";

/**
 * Server bootstrap
 */
async function startServer() {
  try {
    // Initialize in-memory database
    await initDb();

    const app = createApp();
    const port = config.port;

    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
      console.log(`📝 Environment: ${config.nodeEnv}`);
      console.log(`📚 API docs: http://localhost:${port}/api-docs`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();