import cron from "node-cron";
import {
  isLastDayOfMonth,
  generateMonthlySalaryBatch,
} from "../services/salaryAutoGeneration.service.js";

const TIMEZONE = process.env.SALARY_GENERATION_TIMEZONE || "Asia/Kolkata";

/**
 * Scheduled Cron Job for Automatic Monthly Salary Slip Generation.
 *
 * Runs every day at 23:00 (11:00 PM) in Asia/Kolkata timezone.
 * Checks whether the current day is the final calendar day of the month
 * (handling 28/29 Feb, 30-day, and 31-day months accurately).
 *
 * If it is the last day, it executes the idempotent batch salary slip generation
 * for all active employees.
 */
cron.schedule(
  "0 23 * * *",
  async () => {
    try {
      if (process.env.AUTO_SALARY_GENERATION_ENABLED === "false") {
        console.log("[Cron:Salary] Automatic salary generation is disabled via environment variable.");
        return;
      }

      const now = new Date();
      const { isLastDay, month, year, day, totalDaysInMonth } = isLastDayOfMonth(now, TIMEZONE);

      if (!isLastDay) {
        // Not the last day of the month, do nothing
        return;
      }

      console.log(
        `[Cron:Salary] Last day of month detected (Day ${day}/${totalDaysInMonth} of ${month}/${year} [${TIMEZONE}]). ` +
        `Triggering automated salary slip generation...`
      );

      const result = await generateMonthlySalaryBatch({ month, year });

      console.log(
        `[Cron:Salary] Automated salary generation completed for ${month}/${year}. ` +
        `Created: ${result.createdCount}, Skipped: ${result.skippedCount}, Failed: ${result.failedCount}`
      );
    } catch (error) {
      console.error("[Cron:Salary] Fatal error during automated salary slip generation cron:", error);
    }
  },
  {
    timezone: TIMEZONE,
  }
);

console.log(`⏰ Automated Monthly Salary Slip Generation Cron registered (runs daily at 23:00 ${TIMEZONE}, triggers on month-end).`);
