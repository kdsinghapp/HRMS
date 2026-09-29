import mongoose from "mongoose";
import SalaryStructure from "../models/salaryStructureSchema.js";
import Attendance from "../models/Attendance.js";
import Payroll from "../models/PayrollSchema.model.js";
import Payslip from "../models/payslip.model.js";
import OldEmployee from "../models/oldEmployee.model.js";

/**
 * Calculates monthly payroll for one employee from their salary structure
 * and attendance records. Does not persist to the database.
 */
export const calculatePayrollDetails = async (employeeId, month, year) => {
  // 1. Employee
  const employee = await OldEmployee.findById(employeeId);

  if (!employee) {
    throw new Error(`Employee with ID ${employeeId} not found`);
  }

  // 2. Salary Structure
  const salaryStructure = await SalaryStructure.findOne({
    employee: employeeId,
  });

  if (!salaryStructure) {
    throw new Error(
      `Salary structure not found for ${
        employee.personal?.fullName
      } (${employee.professional?.employeeId})`
    );
  }

  // 3. Month Days
  const totalWorkingDays = new Date(year, month, 0).getDate();

  // 4. Attendance
  const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const endOfMonth = new Date(
    Date.UTC(year, month, 0, 23, 59, 59, 999)
  );

  const attendanceSummary = await Attendance.aggregate([
    {
      $match: {
        employee: new mongoose.Types.ObjectId(employeeId),
        date: {
          $gte: startOfMonth,
          $lte: endOfMonth,
        },
      },
    },
    {
      $group: {
        _id: null,
        present: {
          $sum: {
            $cond: [{ $eq: ["$status", "present"] }, 1, 0],
          },
        },
        absent: {
          $sum: {
            $cond: [{ $eq: ["$status", "absent"] }, 1, 0],
          },
        },
        halfDay: {
          $sum: {
            $cond: [{ $eq: ["$status", "half-day"] }, 1, 0],
          },
        },
        leave: {
          $sum: {
            $cond: [{ $eq: ["$status", "leave"] }, 1, 0],
          },
        },
        paidLeave: {
          $sum: {
            $cond: [{ $eq: ["$status", "paid-leave"] }, 1, 0],
          },
        },
        unpaidLeave: {
          $sum: {
            $cond: [{ $eq: ["$status", "unpaid-leave"] }, 1, 0],
          },
        },
      },
    },
  ]);

  const counts = attendanceSummary[0] || {
    present: 0,
    absent: 0,
    halfDay: 0,
    leave: 0,
    paidLeave: 0,
    unpaidLeave: 0,
  };

  const presentDays = counts.present;
  const absentDays = counts.absent;
  const halfDays = counts.halfDay;

  // Paid leave salary milegi
  const paidLeaves = counts.paidLeave + counts.leave;

  const unpaidLeaves = counts.unpaidLeave;

  // Salary eligible days
  const payableDays =
    presentDays +
    paidLeaves +
    halfDays * 0.5;

  // Salary Structure
  const {
    basicSalary,
    hra,
    allowances,
    bonus,
    pf,
    esi,
    professionalTax,
    otherDeductions,
  } = salaryStructure;

  // Full Month Gross
  const grossSalary =
    basicSalary +
    hra +
    allowances +
    bonus;

  // Per Day Salary
  const perDaySalary =
    grossSalary / totalWorkingDays;

  // Earned Salary
  const earnedSalary = Number(
    (perDaySalary * payableDays).toFixed(2)
  );

  // Fixed Deductions
  const totalDeductions = Number(
    (
      pf +
      esi +
      professionalTax +
      otherDeductions
    ).toFixed(2)
  );

  // Final Salary
  const netSalary = Math.max(
    0,
    Number(
      (earnedSalary - totalDeductions).toFixed(2)
    )
  );

  return {
    employee: employeeId,

    month,
    year,

    totalWorkingDays,

    presentDays,
    absentDays,
    halfDays,
    paidLeaves,
    unpaidLeaves,

    payableDays,

    basicSalary,
    hra,
    allowances,
    bonus,

    grossSalary,

    perDaySalary: Number(
      perDaySalary.toFixed(2)
    ),

    earnedSalary,

    pf,
    esi,
    professionalTax,
    otherDeductions,

    totalDeductions,

    netSalary,
  };
};
/**
 * Generates payroll for a single employee and saves it to the database.
 * Prevents duplicates.
 */
export const generateEmployeePayroll = async (employeeId, month, year, remarks = null) => {
  // Check if payroll already exists
  const existingPayroll = await Payroll.findOne({ employee: employeeId, month, year });
  if (existingPayroll) {
    throw new Error(`Payroll already generated for this employee for ${month}/${year}`);
  }

  const calculatedDetails = await calculatePayrollDetails(employeeId, month, year);
  
  const payroll = await Payroll.create({
    ...calculatedDetails,
    remarks,
    status: "generated"
  });

  // Also update Employee model to save salaryStructureId reference if missing
  const employee = await OldEmployee.findById(employeeId);
  const salaryStructure = await SalaryStructure.findOne({ employee: employeeId });
  if (salaryStructure && !employee.salaryStructureId) {
    employee.salaryStructureId = salaryStructure._id;
    await employee.save();
  }

  return payroll;
};

/**
 * Recalculates payroll for a given employee and month/year.
 * Prevents recalculation if status is "paid".
 */
export const recalculateEmployeePayroll = async (employeeId, month, year, remarks = null) => {
  const existingPayroll = await Payroll.findOne({ employee: employeeId, month, year });
  if (!existingPayroll) {
    throw new Error(`No payroll record found to recalculate for ${month}/${year}`);
  }

  if (existingPayroll.status === "paid") {
    throw new Error("Cannot recalculate payroll that has already been marked as paid");
  }

  const calculatedDetails = await calculatePayrollDetails(employeeId, month, year);

  // Update existing record
  Object.assign(existingPayroll, {
    ...calculatedDetails,
    remarks: remarks || existingPayroll.remarks
  });

  return await existingPayroll.save();
};

/**
 * Automatically generates monthly payroll for all active employees.
 * Skips employees who already have a payroll record for the given month/year.
 */
export const generateMonthlyPayrollBatch = async (month, year) => {
  // Active employees only
  const employees = await OldEmployee.find({
    "professional.status": "Active",
  });

  let createdCount = 0;
  let skippedCount = 0;
  const errors = [];

  for (const emp of employees) {
    try {
      // Already generated?
      const existing = await Payroll.findOne({
        employee: emp._id,
        month,
        year,
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      // Salary structure exists?
      const hasStructure = await SalaryStructure.findOne({
        employee: emp._id,
      });

      if (!hasStructure) {
        errors.push({
          employeeId: emp._id,
          employeeName: emp.personal?.fullName,
          error: "No salary structure configured",
        });
        continue;
      }

      await generateEmployeePayroll(
        emp._id,
        month,
        year,
        "Auto-generated by monthly batch"
      );

      createdCount++;
    } catch (err) {
      errors.push({
        employeeId: emp._id,
        employeeName: emp.personal?.fullName,
        error: err.message,
      });
    }
  }

  return {
    success: true,
    month,
    year,
    totalEmployees: employees.length,
    createdCount,
    skippedCount,
    failedCount: errors.length,
    errors,
  };
};

/**
 * Generates an employee-facing payslip document referencing the payroll record.
 */
export const generateEmployeePayslip = async (payrollId, status = "released") => {
  const payroll = await Payroll.findById(payrollId).populate("employee");
  if (!payroll) {
    throw new Error("Payroll record not found");
  }

  // Check if payslip already exists
  let payslip = await Payslip.findOne({ payroll: payrollId });
  if (payslip) {
    return payslip;
  }

  const payslipId = `PS-${payroll.year}-${String(payroll.month).padStart(2, "0")}-${payroll.employee.employeeCode || payroll.employee._id}`;

  payslip = await Payslip.create({
    payslipId,
    employee: payroll.employee._id,
    payroll: payroll._id,
    month: payroll.month,
    year: payroll.year,
    status,
    releasedAt: status === "released" ? new Date() : null
  });

  return payslip;
};
