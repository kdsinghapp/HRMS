import mongoose from "mongoose";

const payrollSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee is required"],
      index: true,
    },

    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },

    year: {
      type: Number,
      required: true,
    },

    // Attendance Snapshot
    totalWorkingDays: {
      type: Number,
      required: true,
      default: 0,
    },

    presentDays: {
      type: Number,
      required: true,
      default: 0,
    },

    absentDays: {
      type: Number,
      required: true,
      default: 0,
    },

    halfDays: {
      type: Number,
      required: true,
      default: 0,
    },

    paidLeaves: {
      type: Number,
      required: true,
      default: 0,
    },

    unpaidLeaves: {
      type: Number,
      required: true,
      default: 0,
    },

    payableDays: {
      type: Number,
      required: true,
      default: 0,
    },

    // Salary Structure Snapshot
    basicSalary: {
      type: Number,
      required: true,
      default: 0,
    },

    hra: {
      type: Number,
      required: true,
      default: 0,
    },

    allowances: {
      type: Number,
      required: true,
      default: 0,
    },

    bonus: {
      type: Number,
      required: true,
      default: 0,
    },

    // Deductions Snapshot & Calculations
    absentDeduction: {
      type: Number,
      required: true,
      default: 0,
    },

    halfDayDeduction: {
      type: Number,
      required: true,
      default: 0,
    },

    unpaidLeaveDeduction: {
      type: Number,
      required: true,
      default: 0,
    },

    pf: {
      type: Number,
      required: true,
      default: 0,
    },

    esi: {
      type: Number,
      required: true,
      default: 0,
    },

    professionalTax: {
      type: Number,
      required: true,
      default: 0,
    },

    otherDeductions: {
      type: Number,
      required: true,
      default: 0,
    },

    // Final Calculations
    grossSalary: {
      type: Number,
      required: true,
      default: 0,
    },

    perDaySalary: {
      type: Number,
      required: true,
      default: 0,
    },

    totalDeductions: {
      type: Number,
      required: true,
      default: 0,
    },

    netSalary: {
      type: Number,
      required: true,
      default: 0,
    },

    status: {
      type: String,
      enum: ["generated", "paid", "cancelled"],
      default: "generated",
      index: true,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    remarks: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate payroll generation for the same employee, month, and year
payrollSchema.index(
  {
    employee: 1,
    month: 1,
    year: 1,
  },
  {
    unique: true,
  }
);

const Payroll = mongoose.models.Payroll || mongoose.model("Payroll", payrollSchema);

export default Payroll;