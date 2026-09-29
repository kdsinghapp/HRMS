import mongoose from "mongoose";

export const NOTIFICATION_TYPES = {
  LEAVE: "LEAVE",
  SALARY: "SALARY",
  SUPPORT: "SUPPORT",
  EMPLOYEE: "EMPLOYEE",
  GENERAL: "GENERAL",
  BIRTHDAY: "BIRTHDAY",
  ANNIVERSARY: "ANNIVERSARY",
};

const notificationSchema = new mongoose.Schema(
  {
    // Direct notification to a single user (e.g. "your leave was approved")
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OldEmployee",
      default: null,
    },

    // Broadcast notification to every user with this role (e.g. all HR/Admin
    // should see "new leave request"). When recipientId is set this is ignored.
    recipientRoles: {
      type: [String],
      enum: ["employee", "hr", "admin"],
      default: [],
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      default: NOTIFICATION_TYPES.GENERAL,
    },

    // Frontend route to send the user to when they click the notification
    link: {
      type: String,
      default: null,
    },

    // Who/what triggered this notification
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OldEmployee",
      default: null,
    },

    // Users who have read this notification. Using an array (instead of a
    // single isRead flag) so that role-broadcast notifications can be marked
    // read per-user without affecting other recipients.
    readBy: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "OldEmployee",
      default: [],
    },

    // Used with recipientRoles broadcasts to hide the notification from a
    // specific user (e.g. everyone gets "It's X's birthday today!" except
    // X themselves, who instead gets their own personalized wish).
    excludedRecipientIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "OldEmployee",
      default: [],
    },
  },
  { timestamps: true },
);

// Performance indexes for notification queries
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientRoles: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
