import { z } from "zod";

export const normalizeUsername = (value: string) => value.trim().replace(/\s+/g, "_").toLowerCase();

const usernameSchema = z
  .string()
  .transform(normalizeUsername)
  .pipe(z.string().min(3, "Minimo 3 caracteres").regex(/^[\p{L}0-9_]+$/u, "Solo letras, numeros y _"));

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

export const clientRegisterSchema = z.object({
  firstName: z.string().min(1, "Requerido"),
  lastName: z.string().min(1, "Requerido"),
  username: usernameSchema,
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  phone: z.string().optional(),
  location: z.string().min(1, "Requerido"),
});

export const completeProfileSchema = z.object({
  username: usernameSchema,
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

export const completeProfileFormSchema = completeProfileSchema
  .extend({ confirmPassword: z.string().min(1, "Requerido") })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const professionalRegisterSchema = z.object({
  firstName: z.string().min(1, "Requerido"),
  lastName: z.string().min(1, "Requerido"),
  username: usernameSchema,
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  specialty: z.string().min(3, "Mínimo 3 caracteres"),
  phone: z.string().min(1, "Requerido"),
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
export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;
export type CompleteProfileFormInput = z.infer<typeof completeProfileFormSchema>;
export type ClientRegisterInput = z.infer<typeof clientRegisterSchema>;
export type ClientRegisterFormInput = z.infer<typeof clientRegisterFormSchema>;
export type ProfessionalRegisterInput = z.infer<typeof professionalRegisterSchema>;
export type ProfessionalRegisterFormInput = z.infer<typeof professionalRegisterFormSchema>;
