import mongoose from "mongoose";

const salarySchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OldEmployee",
      required: true,
    },

    salaryType: {
      type: String,
      enum: ["monthly", "yearly"],
      default: "monthly",
    },

    effectiveFrom: {
      type: Date,
      required: true,
    },

    // Payroll Period
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

    // Attendance (future use)
    workingDays: {
      type: Number,
      default: 0,
    },

    paidDays: {
      type: Number,
      default: 0,
    },

    leaveWithoutPay: {
      type: Number,
      default: 0,
    },

    // Earnings
    basic: {
      type: Number,
      default: 0,
    },

    hra: {
      type: Number,
      default: 0,
    },

    conveyanceAllowance: {
      type: Number,
      default: 0,
    },

    medicalAllowance: {
      type: Number,
      default: 0,
    },

    specialAllowance: {
      type: Number,
      default: 0,
    },

    bonus: {
      type: Number,
      default: 0,
    },

    grossSalary: {
      type: Number,
      default: 0,
    },

    // Deductions
    pf: {
      type: Number,
      default: 0,
    },

    esi: {
      type: Number,
      default: 0,
    },

    professionalTax: {
      type: Number,
      default: 0,
    },

    leaveDeduction: {
      type: Number,
      default: 0,
    },

    otherDeduction: {
      type: Number,
      default: 0,
    },

    totalDeduction: {
      type: Number,
      default: 0,
    },

    // Final Salary
    netSalary: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["draft", "generated", "paid"],
      default: "generated",
    },

    paidDate: {
      type: Date,
    },

    remarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// One salary per employee per month
salarySchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model("Salary", salarySchema);
