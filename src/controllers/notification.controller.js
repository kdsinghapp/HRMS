import Notification from "../models/notification.model.js";

// Build the base "belongs to this user" filter: either sent directly to
// them, or broadcast to a role they hold.
const buildVisibilityFilter = (req) => ({
  $and: [
    {
      $or: [
        { recipientId: req.user.id },
        { recipientRoles: { $in: req.user.roles || [] } },
      ],
    },
    // Exclude broadcasts explicitly not meant for this user (e.g. the
    // birthday person is skipped from the company-wide "it's X's birthday"
    // announcement since they already get their own personal wish).
    { excludedRecipientIds: { $ne: req.user.id } },
  ],
});

// GET MY NOTIFICATIONS
export const getMyNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = buildVisibilityFilter(req);

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Notification.countDocuments(filter),
    ]);

    // Attach a per-user "isRead" flag derived from readBy so the frontend
    // doesn't need to know about the underlying array.
    const data = notifications.map((n) => ({
      ...n.toObject(),
      isRead: n.readBy.some((id) => id.toString() === req.user.id.toString()),
    }));

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      data,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET UNREAD COUNT
export const getUnreadCount = async (req, res) => {
  try {
    const filter = {
      ...buildVisibilityFilter(req),
      readBy: { $ne: req.user.id },
    };

    const count = await Notification.countDocuments(filter);

    res.status(200).json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// MARK ONE AS READ
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      ...buildVisibilityFilter(req),
    });

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    await Notification.updateOne(
      { _id: id },
      { $addToSet: { readBy: req.user.id } }
    );

    res.status(200).json({ success: true, message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// MARK ALL AS READ
export const markAllAsRead = async (req, res) => {
  try {
    const filter = buildVisibilityFilter(req);

    await Notification.updateMany(filter, {
      $addToSet: { readBy: req.user.id },
    });

    res.status(200).json({ success: true, message: "All marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
