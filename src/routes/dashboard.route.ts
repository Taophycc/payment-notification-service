import { FastifyInstance } from "fastify";
import { getDashboardTransactions } from "../controllers/dashboard.controller";
import { authenticate } from "../middleware/authenticate";

export default async function dashboardRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/dashboard/transactions",
    { preHandler: authenticate },
    getDashboardTransactions,
  );
}
