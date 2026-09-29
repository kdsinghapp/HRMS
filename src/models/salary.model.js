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

    da: {
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

    // Metadata: Auto vs Manual tracking
    generationType: {
      type: String,
      enum: ["MANUAL", "AUTO"],
      default: "MANUAL",
    },

    isManuallyModified: {
      type: Boolean,
      default: false,
    },

    generatedAt: {
      type: Date,
      default: Date.now,
    },

    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OldEmployee",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OldEmployee",
    },
  },
  {
    timestamps: true,
  },
);

// One salary per employee per month
salarySchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

// ==========================
// Always derive gross / total deduction / net from the actual
// component fields before saving, so edits made anywhere (create,
// HR manual edit, etc.) are reflected correctly instead of leaving
// stale totals behind.
//
// Note: Mongoose 9 no longer passes a `next` callback into pre('save')
// hooks — a synchronous function (or one returning a promise) is all
// that's needed, so there's nothing to call at the end.
// ==========================
salarySchema.pre("save", function () {
  this.grossSalary =
    (this.basic || 0) +
    (this.hra || 0) +
    (this.conveyanceAllowance || 0) +
    (this.medicalAllowance || 0) +
    (this.specialAllowance || 0) +
    (this.da || 0) +
    (this.bonus || 0);

  this.totalDeduction =
    (this.pf || 0) +
    (this.esi || 0) +
    (this.professionalTax || 0) +
    (this.leaveDeduction || 0) +
    (this.otherDeduction || 0);

  this.netSalary = this.grossSalary - this.totalDeduction;
});

export default mongoose.model("Salary", salarySchema);
