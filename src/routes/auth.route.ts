import { FastifyInstance } from "fastify";
import {
  register,
  login,
  refresh,
  logOut,
} from "../controllers/auth.controller";
import { authenticate } from "../middleware/authenticate";
import { getDashboardTransactions } from "../controllers/dashboard.controller";

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/auth/register", register);
  fastify.post("/auth/login", login(fastify));
  fastify.post("/auth/refresh", refresh(fastify));
  fastify.post("/auth/logout", { preHandler: authenticate }, logOut);
}
