import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "../controllers/notification.controller.js";

const router = express.Router();

// All notification routes require a logged-in user (employee, hr, or admin)
router.use(authMiddleware);

// GET /api/notifications  — list (paginated) notifications for current user
router.get("/", getMyNotifications);

// GET /api/notifications/unread-count
router.get("/unread-count", getUnreadCount);

// PATCH /api/notifications/mark-all-read
router.patch("/mark-all-read", markAllAsRead);

// PATCH /api/notifications/:id/read
router.patch("/:id/read", markAsRead);

export default router;
