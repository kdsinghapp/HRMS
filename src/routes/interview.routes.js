import express from "express";
import {
  cancelInterview,
  completeInterview,
  getCandidateInterviews,
  getCandidateSummary,
  getInterviewerInterviews,
  scheduleInterview,
} from "../controllers/InterviewController/interview.controller.js";

const router = express.Router();

router.post("/schedule", scheduleInterview);
router.put("/:interviewId/review", completeInterview);
router.put("/:id/cancle", cancelInterview);
router.get("/interviewer/:employeeId", getInterviewerInterviews); 
router.get("/candidate/:candidateId", getCandidateInterviews);
router.get("/CandidateSummary/:candidateId", getCandidateSummary);

export default router;
