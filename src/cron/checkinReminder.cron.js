import cron from "node-cron";
import { autoCheckoutToday } from "../services/attendance.service.js";

cron.schedule(
  "30 23 * * *",
  async () => {
    console.log("Running auto checkout at IST 11:30 PM");
    await autoCheckoutToday();
  },
  {
    timezone: "Asia/Kolkata",
  },
);