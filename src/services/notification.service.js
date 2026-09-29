import Notification from "../models/notification.model.js";
import { getIO } from "../config/socket.js";

// Emit a freshly created notification doc to whichever socket room(s) it
// belongs to, so connected clients update instantly without polling.
const pushRealtime = (notification) => {
  try {
    const io = getIO();
    if (!io || !notification) return;

    const payload = {
      ...notification.toObject(),
      isRead: false, // always unread the moment it's pushed
    };

    if (notification.recipientId) {
      io.to(`user:${notification.recipientId}`).emit("notification:new", payload);
    }

    if (notification.recipientRoles && notification.recipientRoles.length > 0) {
      notification.recipientRoles.forEach((role) => {
        io.to(`role:${role}`).emit("notification:new", payload);
      });
    }
  } catch (error) {
    console.error("Notification socket push error:", error.message);
  }
};

// Create a notification for one specific user; failures are caught so they
// never break the calling flow (leave/salary/support actions).
export const notifyUser = async ({
  recipientId,
  title,
  message,
  type = "GENERAL",
  link = null,
  createdBy = null,
}) => {
  try {
    if (!recipientId) return null;

    const notification = await Notification.create({
      recipientId,
      title,
      message,
      type,
      link,
      createdBy,
    });

    pushRealtime(notification);

    return notification;
  } catch (error) {
    return null;
  }
};

// Create one broadcast notification visible to everyone with the given roles
// (e.g. ["hr", "admin"]); each recipient's read state is tracked via readBy.
export const notifyRoles = async ({
  roles = [],
  title,
  message,
  type = "GENERAL",
  link = null,
  createdBy = null,
  excludeIds = [],
}) => {
  try {
    if (!roles || roles.length === 0) return null;

    const notification = await Notification.create({
      recipientRoles: roles,
      title,
      message,
      type,
      link,
      createdBy,
      excludedRecipientIds: excludeIds,
    });

    pushRealtime(notification);

    return notification;
  } catch (error) {
    return null;
  }
};

// Convenience shortcut: notify HR + Admin together (the most common broadcast)
export const notifyHrAndAdmin = (payload) =>
  notifyRoles({ ...payload, roles: ["hr", "admin"] });
