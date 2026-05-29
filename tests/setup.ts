import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

let container: StartedPostgreSqlContainer;

export async function setup() {
  console.log("Starting Postgres container...");
  container = await new PostgreSqlContainer("postgres:18.3").start();

  const connectionUri = container.getConnectionUri();

  // Set env BEFORE any app module gets imported by tests
  process.env.DATABASE_URL = connectionUri;

  // Also set anything else config/env.ts requires, so its validation passes
  process.env.PAYSTACK_SECRET_KEY = "test_secret";
  process.env.JWT_ACCESS_SECRET = "test_access";
  process.env.JWT_REFRESH_SECRET = "test_refresh";
  process.env.RESEND_API_KEY = "test_resend";
  process.env.TEST_EMAIL = "test@example.com";
  process.env.ALLOWED_ORIGIN = "http://localhost:3000";
  process.env.NODE_ENV = "test";

  // Run migrations against the fresh container
  console.log("Running migrations...");
  const pool = new Pool({ connectionString: connectionUri });
  const db = drizzle(pool);
  await migrate(db, { migrationsFolder: "./drizzle" });
  await pool.end();

  console.log("Test infrastructure ready.");
}

export async function teardown() {
  console.log("Stopping Postgres container...");
  await container.stop();
}
