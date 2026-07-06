import mongoose from "mongoose";

const payslipSchema = new mongoose.Schema(
  {
    payslipId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee is required"],
      index: true,
    },

    payroll: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payroll",
      required: [true, "Payroll reference is required"],
      unique: true,
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

    pdfUrl: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ["draft", "released"],
      default: "draft",
      index: true,
    },

    releasedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Payslip = mongoose.models.Payslip || mongoose.model("Payslip", payslipSchema);

export default Payslip;
