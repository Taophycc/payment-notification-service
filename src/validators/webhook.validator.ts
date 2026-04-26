import { z } from "zod";

export const paystackWebhookSchema = z.object({
  event: z.string(),
  data: z.object({
    id: z.number(),
    reference: z.string(),
    amount: z.number(),
    currency: z.string(),
    status: z.string(),
    customer: z.object({
      first_name: z.string(),
      last_name: z.string().optional(),
      email: z.email(),
    }),
  }),
});

export type PaystackWebhookInput = z.infer<typeof paystackWebhookSchema>;
