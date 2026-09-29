import "./config/loadEnv.js";
import { createServer } from "http";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import app from "./app.js";
import { initSocket } from "./config/socket.js";

// Initialize Background Cron Jobs
import "./cron/autoCheckout.cron.js";
import "./cron/payroll.cron.js";
import "./cron/birthday.cron.js";
import "./cron/anniversary.cron.js";

const PORT = process.env.PORT || 4011;

const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDB();

    // 2. Create HTTP server with Express app
    const httpServer = createServer(app);

    // 3. Initialize Socket.IO instance
    initSocket(httpServer);

    // 4. Start listening
    const server = httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
    });

    // Graceful Shutdown Handler
    const shutdown = async (signal) => {
      console.log(`\n🛑 ${signal} received. Closing HTTP server and database connections...`);
      server.close(async () => {
        try {
          await mongoose.connection.close();
          console.log("✅ MongoDB connection closed.");
          process.exit(0);
        } catch (err) {
          console.error("❌ Error during MongoDB shutdown:", err);
          process.exit(1);
        }
      });

      // Force close if graceful close hangs
      setTimeout(() => {
        console.error("⚠️ Forcefully terminating process after timeout.");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

  } catch (error) {
    console.error("❌ Server startup error:", error);
    process.exit(1);
  }
};

startServer();
