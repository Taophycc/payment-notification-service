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
import { config } from "../config/index";

export const register = async (req: FastifyRequest, reply: FastifyReply) => {
  const body = registerSchema.safeParse(req.body);

  if (!body.success) {
    req.log.warn({
      ip: req.ip,
      msg: "Invalid user details",
    });
    return reply.status(400).send({
      msg: "Validation failed",
      errors: z.treeifyError(body.error),
    });
  }

  const { email, password } = body.data;

  try {
    const user = await registerUser(email, password);

    req.log.info({
      email,
      msg: "User registered successfully",
    });

    const { passwordHash, refreshToken, ...safeUser } = user;
    return reply
      .status(201)
      .send({ message: "User registered successfully", user: safeUser });
  } catch (err: any) {
    req.log.error({
      err: err.message,
      email,
      msg: "Registration failed unexpectedly",
    });
    if (err.message === "Email already exists") {
      req.log.warn({ email, msg: "Registration attempt with existing email" });
      return reply.status(409).send({ message: err.message });
    }

    return reply.status(500).send({ message: "Internal server error" });
  }
};

export const login =
  (fastify: FastifyInstance) =>
  async (req: FastifyRequest, reply: FastifyReply) => {
    const body = loginSchema.safeParse(req.body);

    if (!body.success) {
      req.log.warn({
        ip: req.ip,
        msg: "Login validation failed",
      });
      return reply.status(400).send({
        message: "Validation failed",
        errors: z.treeifyError(body.error),
      });
    }

    const { email, password } = body.data;

    try {
      const user = await loginUser(email, password);

      req.log.info({
        userId: user.id,
        msg: "User logged in successfully",
      });

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
      req.log.error({
        err: err.message,
        email,
        msg: "Login failed unexpectedly",
      });
      if (err.message === "Invalid credentials") {
        req.log.warn({
          email,
          ip: req.ip,
          msg: "Failed login attempt - invalid credentials",
        });
        return reply.status(401).send({ message: err.message });
      }
      return reply.status(500).send({ message: "Internal server error" });
    }
  };

export const refresh =
  (fastify: FastifyInstance) =>
  async (req: FastifyRequest, reply: FastifyReply) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return reply.status(401).send({ message: "No refresh Token" });
    }

    try {
      const decoded = fastify.jwt.verify(refreshToken) as { id: string };

      const user = await rotateRefreshToken(decoded.id, refreshToken);

      req.log.info({
        userId: decoded.id,
        msg: "Token rotated successfully",
      });

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
      req.log.warn({ msg: "Invalid or expired refresh token attempt" });
      return reply
        .status(401)
        .send({ message: "Invalid or expired refresh token" });
    }
  };

export const logOut = async (request: FastifyRequest, reply: FastifyReply) => {
  const user = request.user as { id: string; email: string };
  const { id } = user;

  await logOutUser(id);
  request.log.info({ userId: id, msg: "User logged out successfully" });
  reply.clearCookie("refreshToken");

  return reply.status(200).send({ message: "Logged out successfully" });
};
