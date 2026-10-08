import mongoose from "mongoose";
import AuditLog from "../models/auditLog.model.js";

const SENSITIVE_KEYS = new Set([
  "password",
  "loginpassword",
  "officialpassword",
  "teamspassword",
  "token",
  "refreshtoken",
  "accesstoken",
  "otp",
  "secret",
]);

// Helper to convert ObjectIds, Buffers, and byte maps to human-readable strings
const cleanValue = (val) => {
  if (val === null || val === undefined) return val;

  // Handle Mongoose / BSON ObjectId
  if (
    val instanceof mongoose.Types.ObjectId ||
    val?._bsontype === "ObjectID" ||
    val?._bsontype === "ObjectId"
  ) {
    return val.toString();
  }

  // Handle Node Buffer
  if (Buffer.isBuffer(val)) {
    return val.toString("hex");
  }

  // Handle Date
  if (val instanceof Date) {
    return val.toISOString();
  }

  // Handle byte map objects like { buffer: { "0": 106, ... } }
  if (typeof val === "object") {
    if (val.buffer && typeof val.buffer === "object") {
      const byteVals = Object.values(val.buffer);
      if (
        byteVals.length > 0 &&
        byteVals.every((b) => typeof b === "number" && !isNaN(b))
      ) {
        return byteVals
          .map((b) => Number(b).toString(16).padStart(2, "0"))
          .join("");
      }
    }

    if (val.type === "Buffer" && Array.isArray(val.data)) {
      return val.data
        .map((b) => Number(b).toString(16).padStart(2, "0"))
        .join("");
    }

    // Convert Mongoose Documents to plain objects with flattened ObjectIds
    if (typeof val.toObject === "function") {
      return val.toObject({ getters: true, flattenObjectIds: true, virtuals: false });
    }
    if (typeof val.toJSON === "function" && !(val instanceof Date)) {
      return val.toJSON();
    }
  }

  return val;
};

const sanitizeData = (data) => {
  if (!data) return null;

  try {
    const raw = cleanValue(data);

    if (raw === null || raw === undefined) return null;

    if (typeof raw !== "object" || raw instanceof Date) {
      return cleanValue(raw);
    }

    if (Array.isArray(raw)) {
      return raw.map((item) => sanitizeData(item));
    }

    const sanitized = {};
    for (const [key, val] of Object.entries(raw)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        sanitized[key] = "[PROTECTED]";
      } else {
        const cleaned = cleanValue(val);
        if (cleaned && typeof cleaned === "object" && !(cleaned instanceof Date)) {
          sanitized[key] = sanitizeData(cleaned);
        } else {
          sanitized[key] = cleaned;
        }
      }
    }
    return sanitized;
  } catch {
    return null;
  }
};

export const createAuditLog = async ({
  user,
  action,
  module,
  description = "",
  recordId = null,
  oldData = null,
  newData = null,
  req = null,
}) => {
  try {
    const actor = user || req?.user || null;

    const userId = actor?._id || actor?.id || null;
    const userName =
      actor?.personal?.fullName ||
      actor?.name ||
      actor?.fullName ||
      actor?.userName ||
      actor?.email ||
      actor?.account?.officialEmail ||
      "System";

    const userRole = Array.isArray(actor?.roles)
      ? actor.roles.join(", ")
      : actor?.role || (actor?.roles ? String(actor.roles) : "");

    const userEmail =
      actor?.account?.officialEmail ||
      actor?.email ||
      actor?.personalEmail ||
      "";

    let ipAddress = "";
    let userAgent = "";

    if (req) {
      ipAddress =
        req.headers?.["x-forwarded-for"]?.split(",")?.[0]?.trim() ||
        req.socket?.remoteAddress ||
        req.ip ||
        "";
      userAgent = req.headers?.["user-agent"] || "";
    }

    const cleanOldData = sanitizeData(oldData);
    const cleanNewData = sanitizeData(newData);

    const logEntry = {
      userId,
      userName,
      userRole,
      userEmail,
      action: String(action || "UNKNOWN").toUpperCase(),
      module: String(module || "SYSTEM").toUpperCase(),
      description: description || `${String(action || "").toUpperCase()} on ${String(module || "").toUpperCase()}`,
      recordId: recordId ? String(recordId) : null,
      oldData: cleanOldData,
      newData: cleanNewData,
      ipAddress,
      userAgent,
    };

    await AuditLog.create(logEntry);
  } catch (error) {
    console.error("Audit log error:", error.message);
  }
};