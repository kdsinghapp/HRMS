import express from "express";
import Support from "../models/support.model.js";
import { notifyHrAndAdmin } from "../services/notification.service.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { isHrOrAdmin } from "../middlewares/role.middleware.js";

const router = express.Router();

// SECURITY: both routes had no auth at all. "create" is used by the
// logged-in employee Support page (client/src/app/pages/employee-pages/
// Support.jsx) and "get" lists ALL tickets for the HR Support Admin page
// (client/src/app/pages/hr-pages/SupportAdmin.jsx) — neither should be
// public.

// 👉 CREATE support ticket
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const { name, email, category, message } = req.body;

    const newTicket = await Support.create({
      name,
      email,
      category,
      message,
    });

    // Notify HR / Admin
    await notifyHrAndAdmin({
      title: "New Support Ticket",
      message: `${name || "Someone"} raised a ${category || "general"} support ticket`,
      type: "SUPPORT",
      link: "/hr/support-history",
    });

    res.status(201).json({
      success: true,
      message: "Support ticket created",
      data: newTicket,
    });
  } catch (error) {
    console.error("Support create error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create support ticket",
    });
  }
});

// 👉 GET all tickets (HR / Admin only)
router.get("/get", authMiddleware, isHrOrAdmin, async (req, res) => {
  try {
    const tickets = await Support.find();
    res.json({ success: true, data: tickets });
  } catch (error) {
    console.error("Support get error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch tickets" });
  }
});

export default router;
