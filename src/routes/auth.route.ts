import { FastifyInstance } from "fastify";
import {
  register,
  login,
  refresh,
  logOut,
} from "../controllers/auth.controller";
import { authenticate } from "../middleware/authenticate";
import { config } from "../config/index";

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/auth/register",
    {
      config: {
        rateLimit: {
          max: config.rateLimit.global.max,
          timeWindow: config.rateLimit.auth.timeWindow,
        },
      },
    },
    register,
  );
  fastify.post(
    "/auth/login",
    {
      config: {
        rateLimit: {
          max: config.rateLimit.global.max,
          timeWindow: config.rateLimit.auth.timeWindow,
        },
      },
    },
    login(fastify),
  );
  fastify.post("/auth/refresh", refresh(fastify));
  fastify.post("/auth/logout", { preHandler: authenticate }, logOut);
}
