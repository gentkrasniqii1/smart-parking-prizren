import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email-i është i detyrueshëm").email("Email jo i vlefshëm"),
  password: z.string().min(1, "Fjalëkalimi është i detyrueshëm"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.string().min(1, "Email-i është i detyrueshëm").email("Email jo i vlefshëm"),
  password: z
    .string()
    .min(8, "Fjalëkalimi duhet të ketë të paktën 8 karaktere"),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
