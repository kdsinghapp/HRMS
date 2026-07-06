import AuditLog from "../models/auditLog.model.js";

export const createAuditLog = async ({
  user,
  action,
  module,
  recordId,
  oldData = null,
  newData = null,
  req,
}) => {
  try {
    await AuditLog.create({
      userId: user?.id || null,
      userName: user?.name || "System",
      action,
      module,
      recordId,
      oldData,
      newData,
      ipAddress: req?.ip || "",
    });
  } catch (error) {
    console.error("Audit log error:", error.message);
  }
};