import mongoose from "mongoose";

// Single-document collection holding company-wide configuration that only
// Admin should be able to change. HR consumes this (read-only) wherever
// relevant; nothing else in the app writes to it.
const systemSettingsSchema = new mongoose.Schema(
  {
    // A fixed key guarantees the collection only ever holds one document.
    singletonKey: {
      type: String,
      default: "GLOBAL",
      unique: true,
    },

    companyName: { type: String, default: "Technorizen" },
    companyEmail: { type: String, default: "" },
    companyPhone: { type: String, default: "" },
    companyAddress: { type: String, default: "" },
    companyLogoUrl: { type: String, default: "" },
    currency: { type: String, default: "INR" },

    workingHours: {
      startTime: { type: String, default: "09:30" }, // "HH:mm"
      endTime: { type: String, default: "18:30" },
      graceMinutes: { type: Number, default: 10 },
    },

    leavePolicy: {
      annualLeaveDays: { type: Number, default: 18 },
      sickLeaveDays: { type: Number, default: 6 },
      casualLeaveDays: { type: Number, default: 6 },
      carryForwardAllowed: { type: Boolean, default: true },
    },

    security: {
      passwordMinLength: { type: Number, default: 6 },
      maxLoginAttempts: { type: Number, default: 5 },
      sessionExpiryDays: { type: Number, default: 7 },
    },

    maintenanceMode: {
      enabled: { type: Boolean, default: false },
      message: {
        type: String,
        default: "System is under maintenance. Please check back shortly.",
      },
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OldEmployee",
      default: null,
    },
  },
  { timestamps: true },
);

export default mongoose.models.SystemSettings ||
  mongoose.model("SystemSettings", systemSettingsSchema);
