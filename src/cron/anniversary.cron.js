import cron from "node-cron";
import { sendAnniversaryWishes } from "../services/anniversary.service.js";

// Runs every day at 12:00 AM (midnight) IST — same moment as the birthday
// job — and sends out the work-anniversary email + personal dashboard
// popup to any employee completing a full year (or more) with the company
// today.
cron.schedule(
  "0 0 * * *",
  async () => {
    const count = await sendAnniversaryWishes();
  },
  {
    timezone: "Asia/Kolkata",
  },
);

