import express from "express";
import { createVisitor, getVisitorById, getVisitors, updateVisitorStatus, } from './../controllers/EmployeeControllers/visitor.Controller.js';

const router = express.Router();

router.post("/create", createVisitor);
router.get("/getAllVisitor", getVisitors);
router.get("/getVisitorById/:id", getVisitorById);
router.patch("/updateStatus/:id/status", updateVisitorStatus);
export default router;
