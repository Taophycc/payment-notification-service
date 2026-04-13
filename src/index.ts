import "dotenv/config";
import Fastify, { FastifyReply } from "fastify";
import fastifyJwt from "@fastify/jwt";
import fastifyCookie from "@fastify/cookie";
import fastifyFormBody from "@fastify/formbody";
import fastifyView from "@fastify/view";
import fastifyCors from "@fastify/cors";
import fastifyRateLimit from "@fastify/rate-limit";
import webhookRoutes from "./routes/webhook.route";
import authRoutes from "./routes/auth.route";
import dashboardRoutes from "./routes/dashboard.route";
import uiRoute from "./routes/ui.route";
import ejs from "ejs";
import path from "path";

const fastify = Fastify({
  logger: true,
});

await fastify.register(fastifyCors, {
  origin: process.env.ALLOWED_ORIGIN || "http://localhost:3000",
  credentials: true,
});

await fastify.register(fastifyRateLimit, {
  max: 100,
  timeWindow: "1 minute",
});

await fastify.register(fastifyView, {
  engine: { ejs },
  root: path.join(process.cwd(), "views"),
});

await fastify.register(fastifyFormBody);

await fastify.register(fastifyJwt, {
  secret: process.env.JWT_ACCESS_SECRET!,
});

await fastify.register(fastifyCookie, {
  secret: process.env.JWT_REFRESH_SECRET!,
});

fastify.addContentTypeParser(
  "application/json",
  { parseAs: "buffer" },
  function (req, body, done) {
    try {
      req.rawBody = body as Buffer;
      const json = JSON.parse(body.toString());
      done(null, json);
    } catch (err) {
      done(err as Error, undefined);
    }
  },
);

fastify.register(webhookRoutes, { prefix: "/api" });
fastify.register(authRoutes, { prefix: "/api" });
fastify.register(dashboardRoutes, { prefix: "/api" });
fastify.register(uiRoute);

fastify.get("/", function (_, reply: FastifyReply) {
  reply.send({ Hello: "World!" });
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
