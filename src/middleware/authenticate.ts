import { FastifyRequest, FastifyReply } from "fastify";

export const authenticate = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.status(401).send({ message: "Unauthorized" });
  }
};

export const authenticateUI = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const token = request.cookies.accessToken;

    if (!token) {
      return reply.redirect("/login");
    }

    const decoded = request.server.jwt.verify(token) as {
      id: string;
      email: string;
    };
    request.user = decoded;
  } catch (err) {
    return reply.redirect("/login");
  }
};
