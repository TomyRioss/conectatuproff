import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

export const clientRegisterSchema = z.object({
  firstName: z.string().min(1, "Requerido"),
  lastName: z.string().min(1, "Requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  phone: z.string().optional(),
});

export const professionalRegisterSchema = z.object({
  firstName: z.string().min(1, "Requerido"),
  lastName: z.string().min(1, "Requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  phone: z.string().min(1, "Requerido"),
  dni: z.string().regex(/^\d{7,8}$/, "DNI inválido (7 u 8 dígitos)"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ClientRegisterInput = z.infer<typeof clientRegisterSchema>;
export type ProfessionalRegisterInput = z.infer<typeof professionalRegisterSchema>;
export type ProfessionalRegisterOutput = Omit<ProfessionalRegisterInput, "dni"> & { dni: number };
