import "dotenv/config";
import Fastify, { FastifyRequest, FastifyReply } from "fastify";
import fastifyJwt from "@fastify/jwt";
import fastifyCookie from "@fastify/cookie";
import webhookRoutes from "./routes/webhook.route";
import authRoutes from "./routes/auth.route";
// import dashboardRoutes from "./routes/dashboard.route";

const fastify = Fastify({
  logger: true,
});

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
// fastify.register(dashboardRoutes, { prefix: "/api" });

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
