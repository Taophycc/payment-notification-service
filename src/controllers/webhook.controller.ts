import { FastifyRequest, FastifyReply } from "fastify";
import verifySignature from "../services/webhook.service";
import { createTransaction } from "../services/transaction.service";

export const handleWebhook = async (
  req: FastifyRequest,
  reply: FastifyReply,
) => {
  if (!verifySignature(req)) {
    return reply.status(401).send({ message: "Invalid signature" });
  }

  const body = req.body as any;

  await createTransaction(body);

  return reply.status(200).send({ received: true });
};
