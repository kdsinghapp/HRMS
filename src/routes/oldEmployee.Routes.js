import express from "express";
import upload from "../services/uploads.js";

import {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  getEmployees,
  updateEmployee,
} from "../controllers/EmployeeControllers/oldEmployee.Controller.js";

const router = express.Router();

/* -------- CREATE -------- */

router.post(
  "/create",
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

/* -------- GET -------- */

router.get("/getAllEmployees", getAllEmployees);
router.get("/getEmployees", getEmployees);
router.get("/:id", getEmployeeById);

/* -------- UPDATE -------- */

router.patch(
  "/update/:id",
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

/* -------- DELETE -------- */


export default router;