import express from "express";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  applyForJob,
  deleteApplication,
  getAllApplications,
  getApplicationsByJob,
  getSingleApplication,
  updateApplicationStatus,
} from "../controllers/jodsController/application.controller.js";

const router = express.Router();

/* ===== PUBLIC ===== */
router.post("/apply/:jobId", applyForJob);

/* ===== ADMIN ===== */
router.get("/getAllApplications", authMiddleware, getAllApplications);
router.get("/job/:jobId", authMiddleware, getApplicationsByJob);
router.get("/:id", authMiddleware, getSingleApplication);
router.patch("/updateStatus/:id/status", authMiddleware, updateApplicationStatus);
router.delete("/:id", authMiddleware, deleteApplication);

export default router;
