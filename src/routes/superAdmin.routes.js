import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { isAdminOnly } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

import {
  createStaffSchema,
  updateRolesSchema,
  adminResetPasswordSchema,
  departmentSchema,
  updateDepartmentSchema,
  designationSchema,
  updateDesignationSchema,
  systemSettingsSchema,
} from "../validators/admin.schema.js";

import {
  listAllUsers,
  getUserById,
  createStaffUser,
  updateUserRoles,
  toggleUserStatus,
  adminResetPassword,
  deleteUser,
  getAdminUserSummary,
} from "../controllers/adminControllers/userManagement.controller.js";

import {
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../controllers/adminControllers/department.controller.js";

import {
  listDesignations,
  createDesignation,
  updateDesignation,
  deleteDesignation,
} from "../controllers/adminControllers/designation.controller.js";

import {
  getSystemSettings,
  updateSystemSettings,
} from "../controllers/adminControllers/systemSettings.controller.js";

import { getAuditSummary } from "../controllers/adminControllers/auditSummary.controller.js";

const router = express.Router();

// Every route below is admin-only — HR (even though HR is treated as
// "admin-adjacent" everywhere else in the app) must NOT pass this gate.
router.use(authMiddleware, isAdminOnly);

// DASHBOARD
router.get("/dashboard/summary", getAdminUserSummary);
router.get("/audit-summary", getAuditSummary);

// USER & ROLE MANAGEMENT
router.get("/users", listAllUsers);
router.get("/users/:id", getUserById);
router.post("/users", validate(createStaffSchema), createStaffUser);
router.patch("/users/:id/roles", validate(updateRolesSchema), updateUserRoles);
router.patch("/users/:id/status", toggleUserStatus);
router.patch(
  "/users/:id/reset-password",
  validate(adminResetPasswordSchema),
  adminResetPassword,
);
router.delete("/users/:id", deleteUser);

// DEPARTMENTS
router.get("/departments", listDepartments);
router.post("/departments", validate(departmentSchema), createDepartment);
router.put("/departments/:id", validate(updateDepartmentSchema), updateDepartment);
router.delete("/departments/:id", deleteDepartment);

// DESIGNATIONS
router.get("/designations", listDesignations);
router.post("/designations", validate(designationSchema), createDesignation);
router.put("/designations/:id", validate(updateDesignationSchema), updateDesignation);
router.delete("/designations/:id", deleteDesignation);

// SYSTEM SETTINGS
router.get("/settings", getSystemSettings);
router.put("/settings", validate(systemSettingsSchema), updateSystemSettings);

export default router;
