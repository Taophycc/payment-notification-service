import { z } from "zod";

export const paystackWebhookSchema = z.object({
  event: z.string(),
  data: z.object({
    id: z.number().nullable().optional(),
    reference: z.string(),
    amount: z.number(),
    currency: z.string(),
    status: z.string(),
    customer: z.object({
      first_name: z.string().nullable().optional(),
      last_name: z.string().nullable().optional(),
      email: z.email(),
    }),
  }),
});

export type PaystackWebhookInput = z.infer<typeof paystackWebhookSchema>;
