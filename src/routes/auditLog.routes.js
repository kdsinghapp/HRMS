import express from "express";
import AuditLog from "../models/auditLog.model.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { isHrOrAdmin } from "../middlewares/role.middleware.js";

const router = express.Router();

// All audit log routes are restricted to HR / Admin
router.use(authMiddleware, isHrOrAdmin);

// ============================================================
// GET /api/audit-logs
// Query params: module, action, userId, startDate, endDate, page, limit
// ============================================================
router.get("/", async (req, res) => {
  try {
    const {
      module,
      action,
      userId,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {};

    if (module)    filter.module    = module.toUpperCase();
    if (action)    filter.action    = action.toUpperCase();
    if (userId)    filter.userId    = userId;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate)   filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AuditLog.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// GET /api/audit-logs/:id  — single log entry
// ============================================================
router.get("/:id", async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ success: false, message: "Audit log not found" });
    }
    return res.status(200).json({ success: true, data: log });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
