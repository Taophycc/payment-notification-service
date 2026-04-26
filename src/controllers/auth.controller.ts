import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  registerUser,
  loginUser,
  saveRefreshToken,
  rotateRefreshToken,
  logOutUser,
} from "../services/auth.service";
import { z } from "zod";
import { registerSchema, loginSchema } from "../validators/auth.validator";
import { RegisterInput, LoginInput } from "../validators/auth.validator";
import { config } from "../config/index";

export const register = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const body = registerSchema.safeParse(request.body);

    if (!body.success) {
      return reply.status(400).send({
        message: "Validation failed",
        errors: z.treeifyError(body.error),
      });
    }

    const { email, password } = body.data;

    const user = await registerUser(email, password);

    const { passwordHash, refreshToken, ...safeUser } = user;
    return reply
      .status(201)
      .send({ message: "User registered successfully", user: safeUser });
  } catch (err: any) {
    if (err.message === "Email already exists") {
      return reply.status(409).send({ message: err.message });
    }
  }
  return reply.status(500).send({ message: "Internal server error" });
};

export const login =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = loginSchema.safeParse(request.body);

      if (!body.success) {
        return reply.status(400).send({
          message: "Validation failed",
          errors: body.error.flatten().fieldErrors,
        });
      }

      const { email, password } = request.body as LoginInput;

      const user = await loginUser(email, password);

      const accessToken = fastify.jwt.sign(
        { id: user.id, email: user.email },
        { expiresIn: config.jwt.accessTokenExpiry },
      );

      const refreshToken = fastify.jwt.sign(
        { id: user.id },
        { expiresIn: config.jwt.refreshTokenExpiry },
      );

      await saveRefreshToken(user.id, refreshToken);

      reply.setCookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });

      return reply.status(200).send({ accessToken });
    } catch (err: any) {
      if (err.message === "Invalid credentials") {
        return reply.status(401).send({ message: err.message });
      }
      return reply.status(500).send({ message: "Internal server error" });
    }
  };

export const refresh =
  (fastify: FastifyInstance) =>
  async (request: FastifyRequest, reply: FastifyReply) => {
    const refreshToken = request.cookies.refreshToken;

    if (!refreshToken) {
      return reply.status(401).send({ message: "No refresh Token" });
    }

    try {
      const decoded = fastify.jwt.verify(refreshToken) as { id: string };

      const user = await rotateRefreshToken(decoded.id, refreshToken);

      const newAccessToken = fastify.jwt.sign(
        { id: user.id, email: user.email },
        { expiresIn: config.jwt.accessTokenExpiry },
      );

      const newRefreshToken = fastify.jwt.sign(
        { id: user.id },
        { expiresIn: config.jwt.refreshTokenExpiry },
      );

      await saveRefreshToken(user.id, newRefreshToken);

      reply.setCookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });

      return reply.status(200).send({ accessToken: newAccessToken });
    } catch (err) {
      return reply
        .status(401)
        .send({ message: "Invalid or expired refresh token" });
    }
  };

export const logOut = async (request: FastifyRequest, reply: FastifyReply) => {
  const user = request.user as { id: string; email: string };
  const { id } = user;

  await logOutUser(id);

  reply.clearCookie("refreshToken");

  return reply.status(200).send({ message: "Logged out successfully" });
};
