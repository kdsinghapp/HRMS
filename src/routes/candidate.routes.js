import express from "express";
import { createCandidate, deleteCandidate, getAllCandidates, getCandidateById, updateCandidate } from "../controllers/jodsController/candidate.controller.js";

const router = express.Router();

router.post("/createCandidate", createCandidate);
router.get("/getAllCandidates", getAllCandidates);
router.get("/getCandidateById/:id", getCandidateById);
router.patch("/updateCandidate/:id", updateCandidate);
router.delete("/deleteCandidate/:id", deleteCandidate);

export default router;
