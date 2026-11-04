import { describe, expect, it } from "vitest";
import { shouldEndSession } from "./session-end";

describe("shouldEndSession", () => {
  it("a 401 for the token still in use ends the session", () => {
    expect(shouldEndSession(401, "t1", "t1")).toBe(true);
  });
  it("a 401 for a token another tab already replaced does not", () => {
    expect(shouldEndSession(401, "t1", "t2")).toBe(false);
  });
  it("other statuses and unauthenticated calls never end it", () => {
    expect(shouldEndSession(403, "t1", "t1")).toBe(false);
    expect(shouldEndSession(undefined, "t1", "t1")).toBe(false);
    expect(shouldEndSession(401, null, "t1")).toBe(false);
  });
});
