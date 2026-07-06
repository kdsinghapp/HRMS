import express from "express";
import {
  createSalaryStructure,
  deleteSalaryStructure,
  getAllSalaryStructures,
  getSalaryStructure,
  getSalaryStructureById,
  updateSalaryStructure,
} from "../controllers/salaryController/SalaryStructure.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { isHrOrAdmin } from "../middlewares/role.middleware.js";

const router = express.Router();

router.post("/create", authMiddleware, isHrOrAdmin, createSalaryStructure);

router.get("/salary-structures", authMiddleware, isHrOrAdmin, getAllSalaryStructures);

router.get("/get/:employeeId", authMiddleware, isHrOrAdmin, getSalaryStructure);

router.get("/getById/:id", authMiddleware, isHrOrAdmin, getSalaryStructureById);

router.patch("/update/:id", authMiddleware, isHrOrAdmin, updateSalaryStructure);

router.delete("/delete/:id", authMiddleware, isHrOrAdmin, deleteSalaryStructure);

export default router;