import mongoose from "mongoose";

const salaryStructureSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OldEmployee",
      required: [true, "Employee is required"],
      unique: true,
      index: true,
    },

    effectiveFrom: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // ==========================
    // Earnings (Fixed Components)
    // ==========================

    basicSalary: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    hra: {
      type: Number,
      min: 0,
      default: 0,
    },

    conveyanceAllowance: {
      type: Number,
      min: 0,
      default: 0,
    },

    medicalAllowance: {
      type: Number,
      min: 0,
      default: 0,
    },

    specialAllowance: {
      type: Number,
      min: 0,
      default: 0,
    },

    bonus: {
      type: Number,
      min: 0,
      default: 0,
    },

    // Optional fixed deduction
    professionalTax: {
      type: Number,
      min: 0,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ==========================
// Virtual - Gross Package
// ==========================

salaryStructureSchema.virtual("grossPackage").get(function () {
  return (
    (this.basicSalary || 0) +
    (this.hra || 0) +
    (this.conveyanceAllowance || 0) +
    (this.medicalAllowance || 0) +
    (this.specialAllowance || 0) +
    (this.bonus || 0)
  );
});

salaryStructureSchema.set("toJSON", {
  virtuals: true,
});

salaryStructureSchema.set("toObject", {
  virtuals: true,
});

export default mongoose.model("SalaryStructure", salaryStructureSchema);