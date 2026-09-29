import express from "express";
import {
  cancelInterview,
  completeInterview,
  getCandidateInterviews,
  getCandidateSummary,
  getInterviewerInterviews,
  scheduleInterview,
} from "../controllers/InterviewController/interview.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { isHrOrAdmin } from "../middlewares/role.middleware.js";

const router = express.Router();

// SECURITY: none of these had auth — interview scheduling, feedback, and
// candidate data were fully public. All interview UI lives under HR
// pages/components (client/src/app/HR-component, .../hr-pages), so this
// is gated the same way the rest of the HR module is.
router.post("/schedule", authMiddleware, isHrOrAdmin, scheduleInterview);
router.put("/:interviewId/review", authMiddleware, isHrOrAdmin, completeInterview);
router.put("/:id/cancle", authMiddleware, isHrOrAdmin, cancelInterview);
router.get("/interviewer/:employeeId", authMiddleware, isHrOrAdmin, getInterviewerInterviews);
router.get("/candidate/:candidateId", authMiddleware, isHrOrAdmin, getCandidateInterviews);
router.get("/CandidateSummary/:candidateId", authMiddleware, isHrOrAdmin, getCandidateSummary);

export default router;
