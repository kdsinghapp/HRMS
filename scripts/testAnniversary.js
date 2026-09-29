import mongoose from "mongoose";
import dotenv from "dotenv";
import { sendAnniversaryWishes } from "../src/services/anniversary.service.js";

dotenv.config();

// MANUAL ANNIVERSARY JOB TEST
// Run this anytime to test the work-anniversary email + dashboard popup
// flow without waiting for the 12:00 AM cron.
//
//   npm run test-anniversary
//
// It runs the exact same function the cron calls (sendAnniversaryWishes),
// so if it works here, it'll work at midnight too. Make sure at least one
// active employee's professional.dateOfJoining (day + month) matches
// today's date AND is at least 1 year in the past, otherwise it'll just
// log "0 anniversaries".

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const count = await sendAnniversaryWishes();

  } catch (error) {
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();
