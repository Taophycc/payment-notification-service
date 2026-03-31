import "dotenv/config";
import Fastify, { FastifyRequest, FastifyReply } from "fastify";
import webhookRoutes from "./routes/webhook.route";

const fastify = Fastify({
  logger: true,
});

fastify.register(webhookRoutes, { prefix: "/api" });

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
