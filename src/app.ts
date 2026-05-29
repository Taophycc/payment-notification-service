import { env } from "./config/env";
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
import healthRoute from "./routes/health.route";
import paymentRoutes from "./routes/payment.route";
import ejs from "ejs";
import path from "path";

export const buildApp = async () => {
  const app = Fastify({ logger: true });

  await app.register(fastifyCors, {
    origin: env.ALLOWED_ORIGIN || "http://localhost:3000",
    credentials: true,
  });

  await app.register(fastifyRateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  await app.register(fastifyView, {
    engine: { ejs },
    root: path.join(process.cwd(), "views"),
  });

  await app.register(fastifyFormBody);

  await app.register(fastifyJwt, {
    secret: env.JWT_ACCESS_SECRET,
  });

  await app.register(fastifyCookie, {
    secret: env.JWT_REFRESH_SECRET,
  });

  app.addContentTypeParser(
    "application/json",
    { parseAs: "buffer" },
    function (req, body, done) {
      try {
        req.rawBody = body as Buffer;
        const json: unknown = JSON.parse(body.toString());
        done(null, json);
      } catch (err) {
        done(err instanceof Error ? err : new Error(String(err)), undefined);
      }
    },
  );

  app.register(webhookRoutes, { prefix: "/api" });
  app.register(authRoutes, { prefix: "/api" });
  app.register(dashboardRoutes, { prefix: "/api" });
  app.register(uiRoute);
  app.register(healthRoute);
  app.register(paymentRoutes, { prefix: "/api" });

  app.get("/", function (_, reply: FastifyReply) {
    reply.send({ Hello: "World!" });
  });

  return app;
};