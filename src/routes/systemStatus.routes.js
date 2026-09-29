import express from "express";
import { getPublicSystemStatus } from "../controllers/adminControllers/systemSettings.controller.js";

const router = express.Router();

router.get("/", getPublicSystemStatus);

export default router;
