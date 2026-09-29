import express from "express";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { isHrOrAdmin } from "../middlewares/role.middleware.js";
import {
  applyForJob,
  deleteApplication,
  getAllApplications,
  getApplicationsByJob,
  getSingleApplication,
  updateApplicationStatus,
} from "../controllers/jobsController/application.controller.js";

const router = express.Router();

// PUBLIC
router.post("/apply/:jobId", applyForJob);

// ADMIN — these were only gated by authMiddleware, so ANY logged-in
// employee (not just HR) could view every applicant's data or change/
// delete applications. Now requires HR/Admin, matching job.routes.js.
router.get("/getAllApplications", authMiddleware, isHrOrAdmin, getAllApplications);
router.get("/job/:jobId", authMiddleware, isHrOrAdmin, getApplicationsByJob);
router.get("/getApplication/:id", authMiddleware, isHrOrAdmin, getSingleApplication);
router.patch("/updateStatus/:id/status", authMiddleware, isHrOrAdmin, updateApplicationStatus);
router.delete("/delete/:id", authMiddleware, isHrOrAdmin, deleteApplication);

export default router;
