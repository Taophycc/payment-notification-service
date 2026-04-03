import {
  integer,
  timestamp,
  pgTable,
  varchar,
  jsonb,
  uuid,
  pgEnum,
} from "drizzle-orm/pg-core";

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "success",
  "failed",
]);
// export const notificationStatusEnum = pgEnum("notification_status", [
//   "pending",
//   "sent",
//   "failed",
// ]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  refreshToken: varchar("refresh_token", { length: 500 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  paystackReference: varchar("paystack_reference", { length: 255 })
    .notNull()
    .unique(),
  rawPayload: jsonb("raw_payload").notNull(),
  customerEmail: varchar(),
  eventType: varchar(),
  amount: integer("amount").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("NGN"),
  status: paymentStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
