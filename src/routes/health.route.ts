import { FastifyInstance } from "fastify";
import { db } from "../db/index";
import { sql } from "drizzle-orm";

export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get("/health", async (_, reply) => {
    try {
      await db.execute(sql`SELECT 1`);
      return reply.status(200).send({
        status: "ok",
        database: "connected",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      return reply.status(503).send({
        status: "error",
        database: "disconnected",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      });
    }
  });
}
