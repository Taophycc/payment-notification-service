import { db } from "../db/index";
import { transactions } from "../db/schema";
import { PaystackWebhookPayload } from "../types/paystack";

const validStatuses = ["pending", "success", "failed"] as const;
type ValidStatus = (typeof validStatuses)[number];

export const createTransaction = async (body: PaystackWebhookPayload) => {
  const status = validStatuses.includes(body.data.status as ValidStatus)
    ? (body.data.status as ValidStatus)
    : "pending";

  await db
    .insert(transactions)
    .values({
      paystackReference: body.data.reference,
      amount: body.data.amount,
      currency: body.data.currency,
      customerEmail: body.data.customer.email,
      eventType: body.event,
      status,
      rawPayload: body,
    })
    .onConflictDoNothing();
};
