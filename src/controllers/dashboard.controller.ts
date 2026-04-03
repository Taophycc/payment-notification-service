import { FastifyRequest, FastifyReply } from "fastify";
import { getTransactions } from "../services/transaction.service";

export const getDashboardTransactions = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const { page = 1, limit = 10 } = request.query as {
      page: number;
      limit: number;
    };
    const offset = (page - 1) * limit;
    const transaction = await getTransactions(limit, offset);
    return reply.status(200).send({ message: transaction });
  } catch (err: any) {
    return reply.status(500).send({ message: "Internal server error" });
  }
};
