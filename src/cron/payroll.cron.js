import cron from "node-cron";
import { generateMonthlyPayrollBatch } from "../services/payroll.service.js";

// Schedule to run at 01:00 AM on the 1st day of every month (Asia/Kolkata timezone)
cron.schedule(
  "0 1 1 * *",
  async () => {
    const now = new Date();
    
    // Determine the previous month and year
    let month = now.getMonth(); // 0-indexed, so 0 is Jan (we want Dec of prev year)
    let year = now.getFullYear();
    
    if (month === 0) {
      month = 12;
      year -= 1;
    }

    console.log(`[Cron] Starting automated monthly payroll generation for month: ${month}, year: ${year}...`);

    try {
      const result = await generateMonthlyPayrollBatch(month, year);
      console.log(
        `[Cron] Payroll generation batch complete. Created: ${result.createdCount}, Skipped: ${result.skippedCount}, Failed: ${result.failedCount}`
      );
      if (result.errors && result.errors.length > 0) {
        console.warn(`[Cron] Errors encountered in ${result.failedCount} records:`, result.errors);
      }
    } catch (error) {
      console.error("[Cron] Critical error in automated monthly payroll job:", error);
    }
  },
  {
    timezone: "Asia/Kolkata",
  }
);

console.log("⏰ Automated Monthly Payroll Generation Cron registered (01:00 AM on 1st of each month).");
