import { describe, it, expect } from "vitest";
import { deriveStatus } from "./transaction.helpers.js";

describe("deriveStatus", () => {
  it("returns the status as-is when it's a known value", () => {
    expect(deriveStatus("success")).toBe("success");
    expect(deriveStatus("failed")).toBe("failed");
    expect(deriveStatus("pending")).toBe("pending");
  });

  it("falls back to 'pending' for an unknown status", () => {
    expect(deriveStatus("weird_paystack_state")).toBe("pending");
  });

  it("falls back to 'pending' for an empty string", () => {
    expect(deriveStatus("")).toBe("pending");
  });
});
