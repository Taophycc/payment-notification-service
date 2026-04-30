import { FastifyInstance } from "fastify";
import { env } from "../config/env";
import { loginUser } from "../services/auth.service";
import { logOutUser } from "../services/auth.service";
import { saveRefreshToken } from "../services/auth.service";
import { getTransactions } from "../services/transaction.service";
import { authenticateUI } from "../middleware/authenticate";

export default async function uiRoutes(fastify: FastifyInstance) {
  fastify.get("/login", async (_, reply) => {
    return reply.view("login.ejs", { error: null });
  });

  fastify.get("/logout", async (request, reply) => {
    reply.clearCookie("accessToken");
    reply.clearCookie("refreshToken");
    return reply.redirect("/login");
  });

  fastify.post("/login", async (request, reply) => {
    const { email, password } = request.body as {
      email: string;
      password: string;
    };

    try {
      const user = await loginUser(email, password);

      const accessToken = fastify.jwt.sign(
        { id: user.id, email: user.email },
        { expiresIn: "15m" },
      );

      const refreshToken = fastify.jwt.sign(
        { id: user.id },
        { expiresIn: "7d" },
      );

      await saveRefreshToken(user.id, refreshToken);

      reply.setCookie("accessToken", accessToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });

      reply.setCookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });

      return reply.redirect("/dashboard");
    } catch (err: any) {
      return reply.view("login.ejs", { error: "Invalid email or password" });
    }
  });

  fastify.get(
    "/dashboard",
    { preHandler: authenticateUI },
    async (_, reply) => {
      const transactions = await getTransactions(10, 0);
      return reply.view("dashboard.ejs", { transactions });
    },
  );
}
