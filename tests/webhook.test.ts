import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import { sql } from "drizzle-orm";
import crypto from "node:crypto";
import type { FastifyInstance } from "fastify";

// Mock the notification service so the test doesn't hit Resend's API.
// Must be declared BEFORE the imports it affects.
vi.mock("../src/services/notification.service.js", () => ({
  sendPaymentNotification: vi.fn().mockResolvedValue(undefined),
}));

import { buildApp } from "../src/app.js";
import { db } from "../src/db/index.js";
import { transactions } from "../src/db/schema.js";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await db.execute(sql`TRUNCATE transactions, notifications RESTART IDENTITY CASCADE`);
});

// Helpers
const buildPayload = () => ({
  event: "charge.success",
  data: {
    reference: "test-ref-12345",
    amount: 50000,
    currency: "NGN",
    status: "success",
    customer: {
      email: "customer@example.com",
      first_name: "Test",
    },
  },
});

const sign = (body: string) =>
  crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!).update(body).digest("hex");
const WEBHOOK_URL = "/api/webhook";

describe("POST /api/webhook", () => {
  it("returns 200 and inserts a transaction for a valid signature", async () => {
    const body = JSON.stringify(buildPayload());
    const response = await app.inject({
      method: "POST",
      url: WEBHOOK_URL,
      headers: {
        "x-paystack-signature": sign(body),
        "content-type": "application/json",
      },
      payload: body,
    });

    expect(response.statusCode).toBe(200);

    const rows = await db.select().from(transactions);
    expect(rows).toHaveLength(1);
    expect(rows[0].paystackReference).toBe("test-ref-12345");
    expect(rows[0].amount).toBe(50000);
    expect(rows[0].customerEmail).toBe("customer@example.com");
    expect(rows[0].status).toBe("success");
  });

  it("rejects requests with an invalid signature", async () => {
    const body = JSON.stringify(buildPayload());

    const response = await app.inject({
      method: "POST",
      url: WEBHOOK_URL,
      headers: {
        "x-paystack-signature": "deadbeef",
        "content-type": "application/json",
      },
      payload: body,
    });

    expect(response.statusCode).toBe(401);

    const rows = await db.select().from(transactions);
    expect(rows).toHaveLength(0);
  });

  it("is idempotent — the same reference twice produces only one row", async () => {
    const body = JSON.stringify(buildPayload());
    const headers = {
      "x-paystack-signature": sign(body),
      "content-type": "application/json",
    };

    const first = await app.inject({
      method: "POST",
      url: WEBHOOK_URL,
      headers,
      payload: body,
    });
    expect(first.statusCode).toBe(200);

    const second = await app.inject({
      method: "POST",
      url: WEBHOOK_URL,
      headers,
      payload: body,
    });
    expect(second.statusCode).toBe(200);

    const rows = await db.select().from(transactions);
    expect(rows).toHaveLength(1);
  });
});
