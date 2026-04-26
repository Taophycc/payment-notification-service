import { FastifyRequest, FastifyReply } from "fastify";
import verifySignature from "../services/webhook.service";
import { createTransaction } from "../services/transaction.service";
import { sendPaymentNotification } from "../services/notification.service";
import { paystackWebhookSchema } from "../validators/webhook.validator";

const chargeEvents = ["charge.success", "charge.failed", "charge.pending"];

export const handleWebhook = async (
  req: FastifyRequest,
  reply: FastifyReply,
) => {
  if (!verifySignature(req)) {
    return reply.status(401).send({ message: "Invalid signature" });
  }

  const parsed = paystackWebhookSchema.safeParse(req.body);

  if (!parsed.success) {
    return reply.status(400).send({ message: "Invalid webhook payload" });
  }

  const body = parsed.data;

  if (!chargeEvents.includes(body.event)) {
    return reply.status(200).send({ received: true });
  }

  const transaction = await createTransaction(body);

  if (transaction && body.event === "charge.success") {
    await sendPaymentNotification(body, transaction.id);
  }

  return reply.status(200).send({ received: true });
};
