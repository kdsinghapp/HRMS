import express from "express";
import upload from "../services/uploads.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { isHrOrAdmin } from "../middlewares/role.middleware.js";
import {
  createCandidateResume,
  deleteCandidateResume,
  getCandidateResumeById,
  getCandidateResumeCategories,
  getCandidateResumes,
  updateCandidateResume,
  updateCandidateResumeStatus,
} from "../controllers/EmployeeControllers/candidateResume.controller.js";

const router = express.Router();

// This whole feature is an internal HR tool (walk-in interview candidates'
// resumes + PII), so every route requires an authenticated HR/Admin session.
router.use(authMiddleware, isHrOrAdmin);

// Category -> Sub-category (domain) master list for the add-candidate form
router.get("/categories", getCandidateResumeCategories);

// CREATE (multipart form, single "resume" file field)
router.post("/create", upload.single("resume"), createCandidateResume);

// READ
router.get("/", getCandidateResumes);
router.get("/:id", getCandidateResumeById);

// UPDATE (edit basic details / category / sub-category, optional resume replace)
router.patch("/:id", upload.single("resume"), updateCandidateResume);

// UPDATE STATUS
router.patch("/:id/status", updateCandidateResumeStatus);

// DELETE (also purges the resume from Cloudinary)
router.delete("/:id", deleteCandidateResume);

export default router;
