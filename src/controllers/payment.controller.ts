import { FastifyRequest, FastifyReply } from "fastify";
import { initializePayment, verifyPayment } from "../services/payment.service";
import { initializePaymentSchema } from "../validators/payment.validator";
import { z } from "zod";

export const initialize = async (req: FastifyRequest, reply: FastifyReply) => {
  const body = initializePaymentSchema.safeParse(req.body);
  if (!body.success) {
    req.log.warn({ ip: req.ip, msg: "Invalid payment initialization data" });
    return reply.status(400).send({
      message: "Validation failed",
      errors: z.treeifyError(body.error),
    });
  }
  const { email, amount, firstName, lastName } = body.data;

  try {
    const payment = await initializePayment(email, amount, firstName, lastName);

    req.log.info({
      email,
      amount,
      reference: payment.reference,
      msg: "Payment initialized successfully",
    });
    return reply.status(200).send({
      authorization_url: payment.authorization_url,
      reference: payment.reference,
    });
  } catch (err: any) {
    if (err.message === "Failed to initialize payment") {
      req.log.error({
        err: err.message,
        email,
        amount,
        msg: "Payment provider unavailable",
      });
      return reply
        .status(502)
        .send({ message: "Payment provider unavailable" });
    }
    req.log.error({
      err: err.message,
      email,
      amount,
      msg: "Payment initialization failed unexpectedly",
    });
    return reply.status(500).send({ message: "Internal server error" });
  }
};

export const verify = async (req: FastifyRequest, reply: FastifyReply) => {
  const { reference } = req.params as { reference: string };

  try {
    const payment = await verifyPayment(reference);
    req.log.info({
      reference,
      status: payment.status,
      msg: "Payment verified successfully",
    });
    return reply.status(200).send({
      status: payment.status,
      reference: payment.reference,
      amount: payment.amount / 100,
      currency: payment.currency,
      email: payment.customer.email,
    });
  } catch (err: any) {
    if (err.message === "Failed to verify payment") {
      req.log.error({
        err: err.message,
        reference,
        msg: "Payment provider unavailable during verification",
      });
      return reply
        .status(502)
        .send({ message: "Payment provider unavailable" });
    }
    req.log.error({
      err: err.message,
      reference,
      msg: "Payment verification failed unexpectedly",
    });
    return reply.status(500).send({ message: "Internal server error" });
  }
};
