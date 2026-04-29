import { FastifyInstance } from "fastify";
import { initialize, verify } from "../controllers/payment.controller";

export default async function paymentRoutes(fastify: FastifyInstance) {
  fastify.post("/payments/initialize", initialize);
  fastify.get("/payments/verify/:reference", verify);
}
