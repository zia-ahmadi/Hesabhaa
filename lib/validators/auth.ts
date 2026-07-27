import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "نام باید حداقل ۲ حرف باشد."),
  email: z.string().email("ایمیل معتبر نیست."),
  password: z.string().min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد."),
});

export const loginSchema = z.object({
  email: z.string().email("ایمیل معتبر نیست."),
  password: z.string().min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد."),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export const customerRoleSchema = z.object({
  role: z.enum(["customer", "admin"]),
});

export const paymentStatusSchema = z.enum(["pending", "completed", "failed", "refunded"]);

export const settingsSchema = z.object({
  siteName: z.string().min(2).max(80).optional(),
  siteDescription: z.string().max(500).optional(),
  supportEmail: z.string().email().optional(),
  currency: z.string().min(3).max(10).optional(),
  paymentInstructions: z.string().max(2000).optional(),
  isShopOpen: z.boolean().optional(),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
