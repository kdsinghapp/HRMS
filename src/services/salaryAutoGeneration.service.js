import OldEmployee from "../models/oldEmployee.model.js";
import Salary from "../models/salary.model.js";
import SalaryStructure from "../models/salaryStructureSchema.js";
import { notifyUser } from "./notification.service.js";

/**
 * Checks if a given date is the last calendar day of its month in the specified timezone.
 * Correctly accounts for 28/29-day February, leap years, 30-day, and 31-day months.
 *
 * @param {Date} [date=new Date()]
 * @param {string} [timeZone="Asia/Kolkata"]
 * @returns {{ isLastDay: boolean, day: number, month: number, year: number, totalDaysInMonth: number }}
 */
export const isLastDayOfMonth = (date = new Date(), timeZone = "Asia/Kolkata") => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });

  const parts = formatter.formatToParts(date);
  const year = parseInt(parts.find((p) => p.type === "year")?.value || "0", 10);
  const month = parseInt(parts.find((p) => p.type === "month")?.value || "0", 10); // 1-12
  const day = parseInt(parts.find((p) => p.type === "day")?.value || "0", 10);

  // Total days in this month: day 0 of the NEXT month gives the last day of this month
  const totalDaysInMonth = new Date(year, month, 0).getDate();

  return {
    isLastDay: day === totalDaysInMonth,
    day,
    month,
    year,
    totalDaysInMonth,
  };
};

/**
 * Derives the salary components for an active employee for a given month/year
 * using their SalaryStructure or existing baseline.
 *
 * @param {string|mongoose.Types.ObjectId} employeeId
 * @param {number} month (1-12)
 * @param {number} year (e.g. 2026)
 */
export const calculateAutoSalaryDetails = async (employeeId, month, year) => {
  const employee = await OldEmployee.findById(employeeId);
  if (!employee) {
    throw new Error(`Employee ${employeeId} not found`);
  }

  // 1. Fetch employee's active salary structure
  let structure = await SalaryStructure.findOne({
    employee: employeeId,
    isActive: { $ne: false },
  });

  // If no SalaryStructure found, fallback to checking the most recent Salary record as baseline
  if (!structure) {
    const previousSalary = await Salary.findOne({ employee: employeeId })
      .sort({ year: -1, month: -1 });

    if (!previousSalary) {
      throw new Error(
        `No salary structure or historical baseline found for employee: ${
          employee.personal?.fullName || employee.professional?.employeeId || employeeId
        }`
      );
    }

    // Use previous salary as baseline
    structure = {
      basicSalary: previousSalary.basic || 0,
      hra: previousSalary.hra || 0,
      conveyanceAllowance: previousSalary.conveyanceAllowance || 0,
      medicalAllowance: previousSalary.medicalAllowance || 0,
      specialAllowance: previousSalary.specialAllowance || 0,
      bonus: previousSalary.bonus || 0,
      professionalTax: previousSalary.professionalTax || 0,
      effectiveFrom: previousSalary.effectiveFrom || new Date(year, month - 1, 1),
    };
  }

  // 2. Fixed Components
  const basic = Number(structure.basicSalary) || 0;
  const hra = Number(structure.hra) || 0;
  const conveyanceAllowance = Number(structure.conveyanceAllowance) || 0;
  const medicalAllowance = Number(structure.medicalAllowance) || 0;
  const specialAllowance = Number(structure.specialAllowance) || 0;
  const da = 0;
  const bonus = Number(structure.bonus) || 0;

  const grossSalary =
    basic +
    hra +
    conveyanceAllowance +
    medicalAllowance +
    specialAllowance +
    da +
    bonus;

  // 3. Deductions
  // PF = 12% of Basic
  const pf = Math.round((basic * 12) / 100);

  // ESI = 0.75% of Gross (only if gross <= 21000)
  const esi =
    grossSalary <= 21000
      ? Number(((grossSalary * 0.75) / 100).toFixed(2))
      : 0;

  const professionalTax = Number(structure.professionalTax) || 0;
  const leaveDeduction = 0;
  const otherDeduction = 0;

  const effectiveFrom = structure.effectiveFrom || new Date(year, month - 1, 1);

  return {
    employee: employeeId,
    month,
    year,
    salaryType: "monthly",
    effectiveFrom,
    basic,
    hra,
    conveyanceAllowance,
    medicalAllowance,
    specialAllowance,
    da,
    bonus,
    pf,
    esi,
    professionalTax,
    leaveDeduction,
    otherDeduction,
    status: "generated",
    generationType: "AUTO",
    isManuallyModified: false,
    generatedAt: new Date(),
    remarks: "Auto-generated monthly salary slip",
  };
};

/**
 * Automatically generates monthly salary slips for all active employees.
 * Safe, idempotent, logs all steps, never throws unhandled errors that halt other employees.
 *
 * @param {Object} options
 * @param {number} options.month (1-12)
 * @param {number} options.year (e.g. 2026)
 * @param {string|mongoose.Types.ObjectId} [options.triggeredBy]
 * @returns {Promise<Object>} summary report
 */
export const generateMonthlySalaryBatch = async ({ month, year, triggeredBy = null }) => {
  const targetMonth = Number(month);
  const targetYear = Number(year);

  if (!targetMonth || targetMonth < 1 || targetMonth > 12 || !targetYear) {
    throw new Error(`Invalid month (${month}) or year (${year}) specified for salary generation.`);
  }

  // End date of the target month in UTC for dateOfJoining comparison
  const endOfTargetMonth = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59, 999));

  // 1. Fetch all active employees
  const activeEmployees = await OldEmployee.find({
    "professional.status": "Active",
  });

  let createdCount = 0;
  let skippedCount = 0;
  const errors = [];
  const createdSalaries = [];

  for (const emp of activeEmployees) {
    const employeeId = emp._id;
    const employeeName = emp.personal?.fullName || "Employee";
    const employeeCode = emp.professional?.employeeId || emp.empCode || employeeId;

    try {
      // 2. Check Date of Joining: do not generate for months before employee joined
      if (emp.professional?.dateOfJoining) {
        const joiningDate = new Date(emp.professional.dateOfJoining);
        // If joining date is strictly after the end of this month, skip
        if (joiningDate > endOfTargetMonth) {
          skippedCount++;
          continue;
        }
      }

      // 3. Idempotency Check: if salary slip already exists for this employee, month & year, skip!
      const existingSalary = await Salary.findOne({
        employee: employeeId,
        month: targetMonth,
        year: targetYear,
      });

      if (existingSalary) {
        // Already exists -> Do NOT overwrite (protects manual changes & avoids duplication)
        skippedCount++;
        continue;
      }

      // 4. Calculate salary details
      const salaryPayload = await calculateAutoSalaryDetails(employeeId, targetMonth, targetYear);
      if (triggeredBy) {
        salaryPayload.generatedBy = triggeredBy;
      }

      // 5. Create Salary document (pre-save hook computes gross, deductions, and net)
      const newSalary = await Salary.create(salaryPayload);
      createdCount++;
      createdSalaries.push({
        id: newSalary._id,
        employee: employeeId,
        name: employeeName,
        netSalary: newSalary.netSalary,
      });

      // 6. Notify Employee
      try {
        await notifyUser({
          recipientId: employeeId,
          title: "Salary Slip Generated",
          message: `Your salary slip for ${targetMonth}/${targetYear} has been automatically generated`,
          type: "SALARY",
          link: "/employee/payroll-salary",
        });
      } catch (notifErr) {
        // Notification failure should not fail salary creation
        console.warn(`[AutoSalary] Notification failed for ${employeeName}:`, notifErr.message);
      }
    } catch (empErr) {
      console.error(`[AutoSalary] Error generating salary for ${employeeName} (${employeeCode}):`, empErr.message);
      errors.push({
        employeeId,
        employeeName,
        employeeCode,
        error: empErr.message,
      });
    }
  }

  const result = {
    success: true,
    month: targetMonth,
    year: targetYear,
    totalActiveEmployees: activeEmployees.length,
    createdCount,
    skippedCount,
    failedCount: errors.length,
    createdSalaries,
    errors,
  };

  console.log(
    `[AutoSalary] Batch finished for ${targetMonth}/${targetYear}: ` +
    `Created: ${createdCount}, Skipped: ${skippedCount}, Failed: ${errors.length}`
  );

  return result;
};
