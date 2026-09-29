import express from "express";
import { createVisitor, getVisitorById, getVisitors, updateVisitorStatus } from "../controllers/EmployeeControllers/visitor.Controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { isHrOrAdmin } from "../middlewares/role.middleware.js";

const router = express.Router();

// "create" stays public — this backs the front-desk kiosk form
// (client/src/public-pages/AddVisitorPage.jsx), which by design has no
// employee logged in. Everything else exposes/mutates visitor PII and
// previously had no auth at all — now restricted to HR/Admin.
router.post("/create", createVisitor);
router.get("/getAllVisitor", authMiddleware, isHrOrAdmin, getVisitors);
router.get("/getVisitorById/:id", authMiddleware, isHrOrAdmin, getVisitorById);
router.patch("/updateStatus/:id/status", authMiddleware, isHrOrAdmin, updateVisitorStatus);
export default router;
