import { z } from "zod";

export const initializePaymentSchema = z.object({
  email: z.email(),
  amount: z
    .number()
    .positive("Amount must be greater than 0")
    .int("Amount must be a whole number"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  metadata: z.object({}).optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
// export type InitializePaymentInput = z.infer<typeof initializePaymentSchema>;

