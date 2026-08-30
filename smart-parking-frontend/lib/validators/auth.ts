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

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email-i është i detyrueshëm").email("Email jo i vlefshëm"),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Fjalëkalimi duhet të ketë të paktën 8 karaktere"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Fjalëkalimet nuk përputhen",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
