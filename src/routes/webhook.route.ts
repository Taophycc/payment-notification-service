import { FastifyInstance } from "fastify";
import { handleWebhook } from "../controllers/webhook.controller";

export default async function webhookRoutes(fastify: FastifyInstance) {
  fastify.post("/webhook", handleWebhook);
}