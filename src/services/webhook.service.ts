import crypto from "crypto";
import { env } from "../config/env";

const verifySignature = (rawBody: Buffer | undefined, signature: string | undefined): boolean => {
  if (!signature) return false;

  const secret = env.PAYSTACK_SECRET_KEY;
  const digest = crypto
    .createHmac("sha512", secret)
    .update(rawBody ?? Buffer.from(""))
    .digest("hex");

  const signatureBuffer = Buffer.from(signature);
  const digestBuffer = Buffer.from(digest);

  if (
    signatureBuffer.length !== digestBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, digestBuffer)
  ) {
    console.warn("Invalid signature. Possible tampering detected.");
    return false;
  }

  return true;
};

export default verifySignature;
