# Testing

## Overview

The test suite has two layers:

- **Unit tests** (`src/**/*.test.ts`) — fast, no infrastructure, no database. Each test file imports a single pure module and covers all its branches in isolation. `vi.mock` stubs the `config/env` module so tests never need a real `.env`.
- **Integration tests** (`tests/`) — start a real Postgres container via Testcontainers, run Drizzle migrations against it, then drive the full HTTP stack through Fastify's `inject()`. No ports are opened; no live network calls are made (Resend is mocked at the module boundary).

Both layers run with a single command: `pnpm test`.

---

## Test files

### `src/services/webhook.service.test.ts`

Unit tests for `verifySignature(rawBody, signature)`.

| Case | What it proves |
|---|---|
| Valid HMAC-SHA512 | Returns `true` |
| Body tampered after signing | Returns `false` |
| Garbage signature (`"deadbeef"`) | Returns `false` — the length guard prevents `timingSafeEqual` from throwing when the two buffers differ in length |
| Missing signature (`undefined`) | Returns `false` early, before any crypto work |

The file mocks `config/env` before importing the module under test:

```ts
vi.mock("../config/env", () => ({
  env: { PAYSTACK_SECRET_KEY: "test_secret_key" },
}));

import verifySignature from "./webhook.service.js";
```

`vi.mock` is hoisted by Vitest, so the mock is always in place before the real module initialises.

---

### `src/services/transaction.service.test.ts`

Unit tests for `deriveStatus(raw: string): ValidStatus` from `transaction.helpers.ts`.

| Case | Expected |
|---|---|
| `"success"`, `"failed"`, `"pending"` | Returned as-is |
| Unknown string (`"weird_paystack_state"`) | Falls back to `"pending"` |
| Empty string | Falls back to `"pending"` |

`deriveStatus` was extracted from `createTransaction` into `transaction.helpers.ts` specifically to make this logic independently testable — no database, no I/O.

---

### `tests/webhook.test.ts`

Integration tests for `POST /api/webhook`.

**Happy path** — valid HMAC-SHA512 signature, `charge.success` event:
```ts
const response = await app.inject({
  method: "POST",
  url: "/api/webhook",
  headers: { "x-paystack-signature": sign(body), "content-type": "application/json" },
  payload: body,
});
expect(response.statusCode).toBe(200);
const rows = await db.select().from(transactions);
expect(rows).toHaveLength(1);
```
Asserts that the row is written with the correct `paystackReference`, `amount`, `customerEmail`, and `status`.

**Invalid signature** — sends `"deadbeef"` as the signature header. Expects `401` and confirms no row was inserted.

**Idempotency** — sends the same payload twice with a valid signature. Both requests return `200`, but only one row exists. This is enforced at the DB level via a unique constraint on `paystack_reference` combined with `onConflictDoNothing`.

---

## Architecture decisions

### `buildApp()` factory in `src/app.ts`

All plugin registration and route wiring lives in `buildApp()`. `src/index.ts` calls `buildApp()` then `.listen()`. Tests call `buildApp()` directly — the app is fully assembled but never bound to a port.

### Testcontainers in `tests/setup.ts`

`globalSetup` spins up a `postgres:18.3` container, sets `process.env.DATABASE_URL` (and all other vars required by `config/env`), then runs Drizzle migrations before any test file is loaded. The same container is reused for the whole test run and torn down in `teardown()`. This gives full schema parity with production without touching your dev database.

### `TRUNCATE` between tests

`beforeEach` truncates both tables and restarts identity sequences:

```ts
await db.execute(sql`TRUNCATE transactions, notifications RESTART IDENTITY CASCADE`);
```

Cheaper than spinning up a new container per test, still gives each test a clean slate.

### `vi.mock` at module boundaries

Unit tests mock `config/env`; integration tests mock `notification.service` to prevent Resend API calls. Both mocks target the module that owns the side effect — not the internal function that calls it. This keeps mocks stable when internals are refactored.

---

## Patterns worth reusing

**Separate wiring from running.** `buildApp` + `listen` split means any test can instantiate a fully configured app without opening a socket.

**Pure logic goes to unit tests; I/O goes to integration tests.** `deriveStatus` has no I/O so it belongs in a unit test. `createTransaction` touches the database so it's covered by the integration layer.

**Mock at module boundaries, not at call sites.** Mocking `notification.service` at the top of the integration test file is stable. Mocking `resend.emails.send` deep inside the service would break if the implementation changed.

**Narrow inputs improve testability.** `verifySignature` originally took a `FastifyRequest`. Refactoring it to accept `(rawBody: Buffer | undefined, signature: string | undefined)` made it trivially testable without constructing a Fastify request object.

**Extract pure helpers from I/O modules.** `deriveStatus` lives in `transaction.helpers.ts` rather than `transaction.service.ts` so it can be imported and tested without pulling in database dependencies.

---

## Running tests

```bash
# Run all tests once (unit + integration)
pnpm test

# Watch mode during development
pnpm test:watch
```

**Docker must be running** before `pnpm test`. Testcontainers pulls and starts a Postgres image on first run (cached locally afterwards). Integration tests have a 30 s per-test timeout and a 60 s hook timeout to accommodate container startup.
