import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

export const clientRegisterSchema = z.object({
  firstName: z.string().min(1, "Requerido"),
  lastName: z.string().min(1, "Requerido"),
  username: z.string().min(3, "Mínimo 3 caracteres").regex(/^[a-z0-9_]+$/, "Solo letras minúsculas, números y _"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  phone: z.string().optional(),
  location: z.string().min(1, "Requerido"),
});

export const professionalRegisterSchema = z.object({
  firstName: z.string().min(1, "Requerido"),
  lastName: z.string().min(1, "Requerido"),
  username: z.string().min(3, "Mínimo 3 caracteres").regex(/^[a-z0-9_]+$/, "Solo letras minúsculas, números y _"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  phone: z.string().min(1, "Requerido"),
  dni: z.string().regex(/^\d{7,8}$/, "DNI inválido (7 u 8 dígitos)"),
  location: z.string().min(1, "Requerido"),
});

export const clientRegisterFormSchema = clientRegisterSchema
  .omit({ location: true })
  .extend({
    confirmPassword: z.string().min(1, "Requerido"),
    province: z.string().min(1, "Requerido"),
    municipality: z.string().min(1, "Requerido"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const professionalRegisterFormSchema = professionalRegisterSchema
  .omit({ location: true })
  .extend({
    confirmPassword: z.string().min(1, "Requerido"),
    province: z.string().min(1, "Requerido"),
    municipality: z.string().min(1, "Requerido"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type ClientRegisterInput = z.infer<typeof clientRegisterSchema>;
export type ClientRegisterFormInput = z.infer<typeof clientRegisterFormSchema>;
export type ProfessionalRegisterInput = z.infer<typeof professionalRegisterSchema>;
export type ProfessionalRegisterFormInput = z.infer<typeof professionalRegisterFormSchema>;
export type ProfessionalRegisterOutput = Omit<ProfessionalRegisterInput, "dni"> & { dni: number };
