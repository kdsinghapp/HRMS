import { z } from "zod";

// STAFF ACCOUNT CREATION (Admin creates an HR or Admin login directly)
export const createStaffSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  officialEmail: z.string().email("A valid official email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  roles: z
    .array(z.enum(["employee", "hr", "admin"]))
    .min(1, "At least one role is required"),
  department: z.string().optional(),
  designation: z.string().optional(),
  contactNo: z.string().optional(),
});

// ROLE UPDATE
export const updateRolesSchema = z.object({
  roles: z
    .array(z.enum(["employee", "hr", "admin"]))
    .min(1, "At least one role is required"),
});

// ADMIN-TRIGGERED PASSWORD RESET
export const adminResetPasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

// DEPARTMENT
export const departmentSchema = z.object({
  name: z.string().min(2, "Department name is required"),
  code: z.string().optional(),
  description: z.string().optional(),
});

export const updateDepartmentSchema = departmentSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// DESIGNATION
export const designationSchema = z.object({
  title: z.string().min(2, "Designation title is required"),
  department: z.string().optional().nullable(),
});

export const updateDesignationSchema = designationSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// SYSTEM SETTINGS (all optional — partial update)
export const systemSettingsSchema = z.object({
  companyName: z.string().optional(),
  companyEmail: z.string().email().optional().or(z.literal("")),
  companyPhone: z.string().optional(),
  companyAddress: z.string().optional(),
  companyLogoUrl: z.string().optional(),
  currency: z.string().optional(),
  workingHours: z
    .object({
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      graceMinutes: z.number().int().nonnegative().optional(),
    })
    .optional(),
  leavePolicy: z
    .object({
      annualLeaveDays: z.number().int().nonnegative().optional(),
      sickLeaveDays: z.number().int().nonnegative().optional(),
      casualLeaveDays: z.number().int().nonnegative().optional(),
      carryForwardAllowed: z.boolean().optional(),
    })
    .optional(),
  security: z
    .object({
      passwordMinLength: z.number().int().min(4).optional(),
      maxLoginAttempts: z.number().int().min(1).optional(),
      sessionExpiryDays: z.number().int().min(1).optional(),
    })
    .optional(),
  maintenanceMode: z
    .object({
      enabled: z.boolean().optional(),
      message: z.string().optional(),
    })
    .optional(),
});
