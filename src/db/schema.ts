import {
  integer,
  timestamp,
  pgTable,
  varchar,
  jsonb,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  first_name: varchar(),
  email: varchar(),
  hashed_password: varchar(),
  refresh_token: varchar(),
  created_at: timestamp().defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  first_name: varchar().notNull(),
  last_name: varchar().notNull(),
  paystack_reference: varchar().notNull().unique(),
  event_type: varchar(),
  amount: integer().notNull(),
  currency: varchar().notNull(),
  customer_email: varchar(),
  status: varchar().notNull(),
  raw_payload: jsonb().notNull(),
  created_at: timestamp().defaultNow().notNull(),
});
