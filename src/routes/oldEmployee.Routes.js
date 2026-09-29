import express from "express";
import upload from "../services/uploads.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { isHrOrAdmin } from "../middlewares/role.middleware.js";

import {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  getEmployees,
  updateEmployee,
} from "../controllers/EmployeeControllers/oldEmployee.Controller.js";

const router = express.Router();

// SECURITY: every route below deals with full employee records (personal
// data, bank details, documents, account credentials) and previously had
// NO authentication at all — anyone on the internet could list, read,
// create, or overwrite any employee. All routes now require an HR/Admin
// session.

// CREATE

router.post(
  "/create",
  authMiddleware,
  isHrOrAdmin,
  upload.fields([
    { name: "personal[profilePhoto]", maxCount: 1 },

    { name: "documents[aadharCard]", maxCount: 1 },
    { name: "documents[panCard]", maxCount: 1 },
    { name: "documents[resume]", maxCount: 1 },
    { name: "documents[education]", maxCount: 1 },
    { name: "documents[experience]", maxCount: 1 },
    { name: "documents[offerLetter]", maxCount: 1 },
  ]),
  createEmployee
);

// GET

router.get("/getAllEmployees", authMiddleware, isHrOrAdmin, getAllEmployees);
router.get("/getEmployees", authMiddleware, isHrOrAdmin, getEmployees);
router.get("/:id", authMiddleware, isHrOrAdmin, getEmployeeById);

// UPDATE

router.patch(
  "/update/:id",
  authMiddleware,
  isHrOrAdmin,
  upload.fields([
    { name: "personal[profilePhoto]", maxCount: 1 },

    { name: "documents[aadharCard]", maxCount: 1 },
    { name: "documents[panCard]", maxCount: 1 },
    { name: "documents[resume]", maxCount: 1 },
    { name: "documents[education]", maxCount: 1 },
    { name: "documents[experience]", maxCount: 1 },
    { name: "documents[offerLetter]", maxCount: 1 },
  ]),
  updateEmployee
);

// DELETE


export default router;
