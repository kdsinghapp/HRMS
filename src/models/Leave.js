import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    leaveType: {
      type: String,
      required: true,
    },

    leaveMode: {
      type: String,
      required: true,
    },

    reason: {
      type: String,
      required: true,
    },

    emergencyContact: {
      type: String,
      required: true,
    },

    dates: [
      {
        type: Date,
        required: true,
      },
    ],

    // 🔥 NEW FIELDS
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"],
      default: "PENDING",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee", // manager/admin
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
    },
  },
  { timestamps: true }
);

// Optimize query performance for employee history and status filters
leaveSchema.index({ employeeId: 1, status: 1 });

export default mongoose.model("Leave", leaveSchema);