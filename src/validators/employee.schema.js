import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),

  dateOfBirth: z.string().optional(), // ISO string
  contactNo: z.string().optional(),
  personalEmail: z.string().email().optional(),

  currentAddress: z.string().optional(),
  permanentAddress: z.string().optional(),
  emergencyNo: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

