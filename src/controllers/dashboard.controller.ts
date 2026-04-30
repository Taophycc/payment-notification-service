import { FastifyRequest, FastifyReply } from "fastify";
import { getTransactions } from "../services/transaction.service";
import { paginationSchema } from "../validators/payment.validator";

export const getDashboardTransactions = async (
  req: FastifyRequest,
  reply: FastifyReply,
) => {
  const parsed = paginationSchema.safeParse(req.query);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.issues, msg: "Invalid pagination params" });
    return reply.status(400).send({ message: parsed.error.issues[0].message });
  }
  const { page, limit } = parsed.data;

  try {
    const offset = (page - 1) * limit;
    const transaction = await getTransactions(limit, offset);
    req.log.info({
      page,
      limit,
      count: transaction.length,
      msg: "Transactions fetched successfully",
    });
    return reply.status(200).send({ transactions: transaction });
  } catch (err: any) {
    req.log.error({ err: err.message, msg: "Failed to fetch transactions" });
    return reply.status(500).send({ message: "Internal server error" });
  }
};
