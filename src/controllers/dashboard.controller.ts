import { FastifyRequest, FastifyReply } from "fastify";
import { getTransactions } from "../services/transaction.service";

export const getDashboardTransactions = async (
  req: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const { page = 1, limit = 10 } = req.query as {
      page: number;
      limit: number;
    };
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
