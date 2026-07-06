import mongoose from "mongoose";
// constants/audit.js

export const MODULES = {
  EMPLOYEE: "EMPLOYEE",
  ATTENDANCE: "ATTENDANCE",
  LEAVE: "LEAVE",
  PAYROLL: "PAYROLL",
  PAYSLIP: "PAYSLIP",
  SALARY: "SALARY",
  SALARY_STRUCTURE: "SALARY_STRUCTURE",
  JOB: "JOB",
  PERFORMANCE: "PERFORMANCE",
  RECRUITMENT: "RECRUITMENT",
  DOCUMENTS: "DOCUMENTS",
};

export const ACTIONS = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  VIEW: "VIEW",
  LOGIN: "LOGIN",
};
const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OldEmployee",
    },

    userName: {
      type: String,
      default: "System",
    },

    action: {
      type: String,
      enum: ["CREATE", "UPDATE", "DELETE", "VIEW", "LOGIN"],
      required: true,
    },

    module: {
      type: String,
      enum: [
        "EMPLOYEE",
        "ATTENDANCE",
        "LEAVE",
        "PAYROLL",
        "PAYSLIP",
        "SALARY",
        "SALARY_STRUCTURE",
        "JOB",
        "PERFORMANCE",
        "RECRUITMENT",
        "DOCUMENTS",
      ],
      required: true,
    },

    recordId: {
      type: mongoose.Schema.Types.ObjectId,
    },

    oldData: mongoose.Schema.Types.Mixed,
    newData: mongoose.Schema.Types.Mixed,

    ipAddress: String,
    userAgent: String,
  },
  { timestamps: true }
);

// Performance indexes for audit log queries
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ module: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

export default mongoose.model("AuditLog", auditLogSchema);