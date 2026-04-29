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
    req.log.warn({ msg: "Invalid signature detected", ip: req.ip });
    return reply.status(401).send({ message: "Invalid signature" });
  }

  const parsed = paystackWebhookSchema.safeParse(req.body);

  if (!parsed.success) {
    req.log.warn({ msg: "Invalid webhook delivery" });
    return reply.status(200).send({ received: true });
  }

  const body = parsed.data;

  if (!chargeEvents.includes(body.event)) {
    req.log.info({ event: body.event, msg: "Ignoring non-charge event" });
    return reply.status(200).send({ received: true });
  }

  req.log.info({
    event: body.event,
    reference: body.data.reference,
    amount: body.data.amount,
    currency: body.data.currency,
    msg: "Processing charge event",
  });

  const transaction = await createTransaction(body);

  if (transaction) {
    req.log.info({
      transactionId: transaction.id,
      reference: body.data.reference,
      msg: "Transaction saved successfully",
    });
  }

  if (transaction && body.event === "charge.success") {
    req.log.info({
      transactionId: transaction.id,
      msg: "Sending payment notification",
    });
    await sendPaymentNotification(body, transaction.id);
  }

  return reply.status(200).send({ received: true });
};
