import express from "express";
import AuditLog from "../models/auditLog.model.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { isHrOrAdmin } from "../middlewares/role.middleware.js";

const router = express.Router();

// All audit log routes are restricted to HR / Admin
router.use(authMiddleware, isHrOrAdmin);

// GET /api/audit-logs - Query params: module, action, userId, search, startDate, endDate, page, limit
router.get("/", async (req, res) => {
  try {
    const {
      module,
      action,
      userId,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {};

    if (module) filter.module = String(module).toUpperCase();
    if (action) filter.action = String(action).toUpperCase();
    if (userId) filter.userId = userId;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filter.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [
        { userName: regex },
        { userEmail: regex },
        { userRole: regex },
        { description: regex },
        { action: regex },
        { module: regex },
        { ipAddress: regex },
        { recordId: regex },
      ];
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(200, Number(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      AuditLog.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/audit-logs/stats - Quick statistics for filters and cards
router.get("/stats/summary", async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [total, creates, updates, deletes, today] = await Promise.all([
      AuditLog.countDocuments({}),
      AuditLog.countDocuments({ action: "CREATE" }),
      AuditLog.countDocuments({ action: "UPDATE" }),
      AuditLog.countDocuments({ action: "DELETE" }),
      AuditLog.countDocuments({ createdAt: { $gte: todayStart } }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        total,
        creates,
        updates,
        deletes,
        today,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/audit-logs/:id — single log entry
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

