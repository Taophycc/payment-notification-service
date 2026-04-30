import crypto from "crypto";
import { FastifyRequest } from "fastify";
import { env } from "../config/env";

const verifySignature = (req: FastifyRequest): boolean => {
  const signature = req.headers["x-paystack-signature"] as string;
  const secret = env.PAYSTACK_SECRET_KEY;

  if (!signature) {
    return false;
  }

  const hmac = crypto.createHmac("sha512", secret);
  const digest = hmac.update(req.rawBody || Buffer.from("")).digest("hex");

  const signatureBuffer = Buffer.from(signature);
  const digestBuffer = Buffer.from(digest);

  if (
    signatureBuffer.length !== digestBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, digestBuffer)
  ) {
    console.warn(" Invalid Signature. Possible tampering detected.");
    return false;
  }
  return true;
};

export default verifySignature;
