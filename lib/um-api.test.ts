import { AxiosError } from "axios";
import { describe, expect, it } from "vitest";
import { umFailureOf } from "./um-api";

// An AxiosError that carries an answer with this status (isAxiosError is set by the class).
const answer = (status: number) => Object.assign(new AxiosError("x"), { response: { status } });

describe("umFailureOf", () => {
  it("UM refusing the token ends the session", () => {
    expect(umFailureOf(answer(401))).toBe("refused");
    expect(umFailureOf(answer(403))).toBe("refused");
  });
  it("anything that is not a refusal keeps the user signed in", () => {
    expect(umFailureOf(answer(429))).toBe("unreachable");
    expect(umFailureOf(answer(400))).toBe("unreachable");
    expect(umFailureOf(answer(404))).toBe("unreachable");
    expect(umFailureOf(answer(503))).toBe("unreachable");
    expect(umFailureOf(new AxiosError("offline", "ERR_NETWORK"))).toBe("unreachable");
    expect(umFailureOf(new TypeError("boom"))).toBe("unreachable");
  });
});
