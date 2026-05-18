import { FastifyRequest, FastifyReply } from "fastify";

export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify();
  } catch (_err) {
    return reply.status(401).send({ message: "Unauthorized" });
  }
};

export const authenticateUI = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const token = request.cookies.accessToken;

    if (!token) {
      return reply.redirect("/login");
    }

    const decoded = request.server.jwt.verify<{ id: string; email: string }>(token);
    request.user = decoded;
  } catch (_err) {
    return reply.redirect("/login");
  }
};
