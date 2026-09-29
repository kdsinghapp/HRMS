import cron from "node-cron";
import { autoCheckoutToday } from "../services/attendance.service.js";

cron.schedule(
  "30 23 * * *",
  async () => {
    await autoCheckoutToday();
  },
  {
    timezone: "Asia/Kolkata",
  },
);
