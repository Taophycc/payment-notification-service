import { db } from "../db/index";
import { transactions } from "../db/schema";
import { PaystackWebhookPayload } from "../types/paystack";
import { desc } from "drizzle-orm";

const validStatuses = ["pending", "success", "failed"] as const;
type ValidStatus = (typeof validStatuses)[number];

export const createTransaction = async (body: PaystackWebhookPayload) => {
  const status = validStatuses.includes(body.data.status as ValidStatus)
    ? (body.data.status as ValidStatus)
    : "pending";

  const [transaction] = await db
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
    .onConflictDoNothing()
    .returning();
  return transaction;
};

export const getTransactions = async (limit: number, offset: number) => {
  return await db
    .select({
      id: transactions.id,
      paystackReference: transactions.paystackReference,
      amount: transactions.amount,
      currency: transactions.currency,
      status: transactions.status,
      customerEmail: transactions.customerEmail,
      eventType: transactions.eventType,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .orderBy(desc(transactions.createdAt))
    .limit(limit)
    .offset(offset);
};
