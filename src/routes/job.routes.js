import express from "express";



import { createJob, deleteJob, getAllJobs, getJobBySlug, updateJob } from "../controllers/jodsController/job.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { isHrOrAdmin } from "../middlewares/role.middleware.js";

const router = express.Router();

/* ================= CREATE JOB ================= */
router.post("/createJobs", authMiddleware, isHrOrAdmin, createJob);

/* ================= GET ALL JOBS ================= */
router.get("/getAllJobs", authMiddleware, isHrOrAdmin, getAllJobs);

/* ================= GET SINGLE JOB ================= */
router.get("/public/:slug", getJobBySlug);

/* ================= UPDATE JOB ================= */
router.patch("/update/:id", authMiddleware, isHrOrAdmin, updateJob);

/* ================= DELETE (ARCHIVE) JOB ================= */
router.delete("/delete/:id", authMiddleware, isHrOrAdmin, deleteJob);

/* ================= UPDATE JOB STATUS ================= */
// router.patch("/update/:id/status", authMiddleware, updateJobStatus);


export default router;