import { describe, expect, it } from "vitest";
import { carriesSession, replacedByAnotherSignIn, sentTokenOf, shouldEndSession } from "./session-end";

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

describe("replacedByAnotherSignIn", () => {
  it("another tab stored a different token", () => {
    expect(replacedByAnotherSignIn("t1", "t2")).toBe(true);
  });
  it("nothing stored, or the same token, is not a replacement", () => {
    expect(replacedByAnotherSignIn("t1", null)).toBe(false);
    expect(replacedByAnotherSignIn(null, null)).toBe(false);
    expect(replacedByAnotherSignIn("t1", "t1")).toBe(false);
  });
});

describe("carriesSession", () => {
  it("sign-in calls never carry the stored token", () => {
    expect(carriesSession("/auth/login")).toBe(false);
    expect(carriesSession("/auth/exchange")).toBe(false);
  });
  it("every other call does", () => {
    expect(carriesSession("/auth/keep-alive")).toBe(true);
    expect(carriesSession("/tables")).toBe(true);
  });
});

describe("sentTokenOf", () => {
  it("reads the bearer token back from the header", () => {
    expect(sentTokenOf({ headers: { Authorization: "Bearer t1" } })).toBe("t1");
  });
  it("is null without an Authorization header", () => {
    expect(sentTokenOf({ headers: {} })).toBeNull();
  });
});
