import { describe, it, expect, vi } from "vitest";
import crypto from "crypto";

vi.mock("../config/env", () => ({
  env: { PAYSTACK_SECRET_KEY: "test_secret_key" },
}));

import verifySignature from "./webhook.service.js";

const SECRET = "test_secret_key";
const sign = (body: string) => crypto.createHmac("sha512", SECRET).update(body).digest("hex");

describe("verifySignature", () => {
  it("returns true for a valid signature", () => {
    const body = JSON.stringify({ event: "charge.success" });
    expect(verifySignature(Buffer.from(body), sign(body))).toBe(true);
  });

  it("returns false when the body is tampered", () => {
    const body = JSON.stringify({ event: "charge.success" });
    const signature = sign(body);
    const tampered = JSON.stringify({ event: "charge.failed" });
    expect(verifySignature(Buffer.from(tampered), signature)).toBe(false);
  });

  it("returns false for a garbage signature", () => {
    const body = JSON.stringify({ event: "charge.success" });
    expect(verifySignature(Buffer.from(body), "deadbeef")).toBe(false);
  });

  it("returns false when the signature header is missing", () => {
    const body = JSON.stringify({ event: "charge.success" });
    expect(verifySignature(Buffer.from(body), undefined)).toBe(false);
  });
});
