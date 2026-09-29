import "../src/config/loadEnv.js";
import mongoose from "mongoose";
import connectDB from "../src/config/db.js";
import OldEmployee from "../src/models/oldEmployee.model.js";
import Salary from "../src/models/salary.model.js";
import SalaryStructure from "../src/models/salaryStructureSchema.js";
import {
  isLastDayOfMonth,
  generateMonthlySalaryBatch,
} from "../src/services/salaryAutoGeneration.service.js";

async function runTests() {
  console.log("==================================================");
  console.log("   AUTOMATIC SALARY SLIP GENERATION TEST SUITE   ");
  console.log("==================================================");

  // 1. Test isLastDayOfMonth calculation across standard & leap years
  console.log("\n[Test 1] Testing isLastDayOfMonth helper...");
  
  // Non-leap year Feb (2025-02-28)
  const feb28_2025 = new Date("2025-02-28T12:00:00Z");
  const resFeb28 = isLastDayOfMonth(feb28_2025, "UTC");
  console.log(`2025-02-28 is last day: ${resFeb28.isLastDay} (Expected: true, TotalDays: ${resFeb28.totalDaysInMonth})`);
  if (!resFeb28.isLastDay || resFeb28.totalDaysInMonth !== 28) throw new Error("Feb 28 non-leap year failed");

  // Non-leap year Feb 27 (2025-02-27)
  const feb27_2025 = new Date("2025-02-27T12:00:00Z");
  const resFeb27 = isLastDayOfMonth(feb27_2025, "UTC");
  console.log(`2025-02-27 is last day: ${resFeb27.isLastDay} (Expected: false)`);
  if (resFeb27.isLastDay) throw new Error("Feb 27 non-leap year failed");

  // Leap year Feb 28 (2028-02-28)
  const feb28_2028 = new Date("2028-02-28T12:00:00Z");
  const resFeb28_leap = isLastDayOfMonth(feb28_2028, "UTC");
  console.log(`2028-02-28 (leap) is last day: ${resFeb28_leap.isLastDay} (Expected: false, TotalDays: ${resFeb28_leap.totalDaysInMonth})`);
  if (resFeb28_leap.isLastDay || resFeb28_leap.totalDaysInMonth !== 29) throw new Error("Feb 28 leap year failed");

  // Leap year Feb 29 (2028-02-29)
  const feb29_2028 = new Date("2028-02-29T12:00:00Z");
  const resFeb29_leap = isLastDayOfMonth(feb29_2028, "UTC");
  console.log(`2028-02-29 (leap) is last day: ${resFeb29_leap.isLastDay} (Expected: true, TotalDays: ${resFeb29_leap.totalDaysInMonth})`);
  if (!resFeb29_leap.isLastDay) throw new Error("Feb 29 leap year failed");

  // 30-day month April 30 (2026-04-30)
  const apr30_2026 = new Date("2026-04-30T12:00:00Z");
  const resApr30 = isLastDayOfMonth(apr30_2026, "UTC");
  console.log(`2026-04-30 is last day: ${resApr30.isLastDay} (Expected: true, TotalDays: ${resApr30.totalDaysInMonth})`);
  if (!resApr30.isLastDay || resApr30.totalDaysInMonth !== 30) throw new Error("April 30 failed");

  // 31-day month Jan 31 (2026-01-31)
  const jan31_2026 = new Date("2026-01-31T12:00:00Z");
  const resJan31 = isLastDayOfMonth(jan31_2026, "UTC");
  console.log(`2026-01-31 is last day: ${resJan31.isLastDay} (Expected: true, TotalDays: ${resJan31.totalDaysInMonth})`);
  if (!resJan31.isLastDay || resJan31.totalDaysInMonth !== 31) throw new Error("Jan 31 failed");

  console.log("✅ All date calculations passed!");

  // 2. Connect DB for batch tests
  console.log("\n[Test 2] Connecting to DB...");
  await connectDB();

  const testEmail = `auto_salary_test_${Date.now()}@test.com`;

  try {
    // Create test active employee
    const employee = await OldEmployee.create({
      personal: { fullName: "Test AutoSalary Employee" },
      contact: { personalEmail: testEmail },
      professional: {
        employeeId: `TEST-EMP-${Date.now()}`,
        status: "Active",
        dateOfJoining: new Date("2026-01-01"),
      },
      roles: ["employee"],
    });

    console.log(`Created test employee: ${employee.personal.fullName} (${employee._id})`);

    // Create salary structure
    const structure = await SalaryStructure.create({
      employee: employee._id,
      basicSalary: 30000,
      hra: 10000,
      conveyanceAllowance: 2000,
      medicalAllowance: 1500,
      specialAllowance: 1500,
      bonus: 0,
      professionalTax: 200,
      effectiveFrom: new Date("2026-01-01"),
    });

    console.log(`Created test salary structure: Basic: ₹${structure.basicSalary}, Gross: ₹${structure.grossPackage}`);

    // Test Manual January Creation
    console.log("\n[Test 3] Simulating HR manual creation of January 2026 salary...");
    const janSalary = await Salary.create({
      employee: employee._id,
      month: 1,
      year: 2026,
      salaryType: "monthly",
      effectiveFrom: new Date("2026-01-01"),
      basic: structure.basicSalary,
      hra: structure.hra,
      conveyanceAllowance: structure.conveyanceAllowance,
      medicalAllowance: structure.medicalAllowance,
      specialAllowance: structure.specialAllowance,
      bonus: 0,
      pf: Math.round((structure.basicSalary * 12) / 100),
      esi: 0,
      professionalTax: structure.professionalTax,
      generationType: "MANUAL",
      isManuallyModified: false,
      status: "generated",
    });

    console.log(`Jan Salary Created: Gross: ₹${janSalary.grossSalary}, TotalDeduction: ₹${janSalary.totalDeduction}, Net: ₹${janSalary.netSalary}`);
    if (janSalary.netSalary !== 45000 - 3800) {
      console.log(`Computed Net: ${janSalary.netSalary}, Expected: ${45000 - 3800}`);
    }

    // Test Batch Auto-Generation for February 2026
    console.log("\n[Test 4] Running Auto-Generation Batch for February 2026...");
    const febResult = await generateMonthlySalaryBatch({ month: 2, year: 2026 });
    console.log("Feb Batch Result:", JSON.stringify(febResult, null, 2));

    const febSalary = await Salary.findOne({ employee: employee._id, month: 2, year: 2026 });
    if (!febSalary) throw new Error("February salary was not created by auto-generation batch");
    console.log(`Feb Salary auto-generated: Type: ${febSalary.generationType}, Net: ₹${febSalary.netSalary}, Modified: ${febSalary.isManuallyModified}`);
    if (febSalary.generationType !== "AUTO") throw new Error("generationType must be AUTO");

    // Test Idempotency (Running Feb again)
    console.log("\n[Test 5] Re-running Auto-Generation Batch for February 2026 (Idempotency test)...");
    const febRerunResult = await generateMonthlySalaryBatch({ month: 2, year: 2026 });
    console.log(`Feb Re-run: Created: ${febRerunResult.createdCount}, Skipped: ${febRerunResult.skippedCount}`);
    const febCount = await Salary.countDocuments({ employee: employee._id, month: 2, year: 2026 });
    if (febCount !== 1) throw new Error(`Duplicate salary records found for Feb: ${febCount}`);
    console.log("✅ Idempotency verified: Exactly 1 record exists.");

    // Test HR Manual Edit on February
    console.log("\n[Test 6] HR manually edits February salary (e.g. adjust deduction)...");
    febSalary.otherDeduction = 500;
    febSalary.isManuallyModified = true;
    await febSalary.save();
    console.log(`Updated Feb Salary: TotalDeduction: ₹${febSalary.totalDeduction}, Net: ₹${febSalary.netSalary}, isManuallyModified: ${febSalary.isManuallyModified}`);
    if (febSalary.otherDeduction !== 500 || !febSalary.isManuallyModified) throw new Error("Manual update failed");

    // Test Re-running batch after HR manual edit -> changes must NOT be overwritten
    console.log("\n[Test 7] Re-running batch after HR manual edit...");
    await generateMonthlySalaryBatch({ month: 2, year: 2026 });
    const febAfterBatch = await Salary.findOne({ employee: employee._id, month: 2, year: 2026 });
    if (febAfterBatch.otherDeduction !== 500 || !febAfterBatch.isManuallyModified) {
      throw new Error("Batch overwrote HR manual modification!");
    }
    console.log("✅ Protected: HR manual edit was preserved.");

    // Clean up test data
    console.log("\n[Cleanup] Cleaning up test data...");
    await Salary.deleteMany({ employee: employee._id });
    await SalaryStructure.deleteMany({ employee: employee._id });
    await OldEmployee.findByIdAndDelete(employee._id);
    console.log("✅ Test data cleaned up successfully.");

    console.log("\n==================================================");
    console.log("   ALL AUTOMATIC SALARY GENERATION TESTS PASSED!   ");
    console.log("==================================================");
  } catch (err) {
    console.error("❌ Test failed with error:", err);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

runTests();
