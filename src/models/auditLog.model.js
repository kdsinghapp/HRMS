import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.Mixed, // string or ObjectId
      ref: "OldEmployee",
    },

    userName: {
      type: String,
      default: "System",
    },

    userRole: {
      type: String,
      default: "",
    },

    userEmail: {
      type: String,
      default: "",
    },

    action: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    module: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    description: {
      type: String,
      default: "",
    },

    recordId: {
      type: mongoose.Schema.Types.Mixed,
    },

    oldData: mongoose.Schema.Types.Mixed,
    newData: mongoose.Schema.Types.Mixed,

    ipAddress: {
      type: String,
      default: "",
    },
    userAgent: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Performance indexes for audit log queries
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ module: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

export default mongoose.model("AuditLog", auditLogSchema);