import dotenv from "dotenv";
import connectDB from "./config/db.js";
import app from "./app.js";
import cors from "cors";

dotenv.config();

import "./cron/autoCheckout.cron.js";
import "./cron/payroll.cron.js";

const PORT = process.env.PORT || 4011;

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    process.on("SIGTERM", () => {
      console.log("SIGTERM received");

      server.close(() => {
        console.log("Server closed");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

startServer();
