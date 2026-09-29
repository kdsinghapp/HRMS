import mongoose from "mongoose";
import dotenv from "dotenv";
import { sendBirthdayWishes } from "../src/services/birthday.service.js";

dotenv.config();

// MANUAL BIRTHDAY JOB TEST
// Run this anytime to test the birthday email + dashboard popup flow
// without waiting for the 12:00 AM cron or editing its schedule.
//
//   npm run test-birthday
//
// It runs the exact same function the cron calls (sendBirthdayWishes),
// so if it works here, it'll work at midnight too. Make sure at least one
// active employee's personal.dob (day + month) matches today's date in
// the database before running this, otherwise it'll just log "0 birthdays".

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const count = await sendBirthdayWishes();

  } catch (error) {
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();
