import cron from "node-cron";
import { sendBirthdayWishes } from "../services/birthday.service.js";

// Runs every day at 12:00 AM (midnight) IST — the exact moment the
// employee's birthday date begins — and sends out birthday emails +
// the dashboard celebration notification.
cron.schedule(
  "0 0 * * *",
  async () => {
    const count = await sendBirthdayWishes();
  },
  {
    timezone: "Asia/Kolkata",
  },
);

