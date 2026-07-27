import { z } from "zod";

export const productSchema = z.object({
  name: z.string().trim().min(2, "Product name must be at least 2 characters.").max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(140)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens for the slug."),
  description: z.string().trim().min(10, "Description must be at least 10 characters.").max(2000),
  price: z.coerce.number().finite().positive("Price must be greater than zero.").max(1_000_000),
  image: z.string().trim().max(2048).optional().or(z.literal("")),
});

export const orderSchema = z.object({
  productId: z.string().trim().min(1),
  quantity: z.coerce.number().int().min(1).max(100).default(1),
});

export const orderStatusSchema = z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]);

export type ProductInput = z.infer<typeof productSchema>;
