import { describe, expect, it } from "vitest";
import { friendlyApiError, friendlyAuthError } from "./authErrors";

describe("friendlyAuthError", () => {
  it("maps wrong-password and unknown-user to the same generic message", () => {
    expect(
      friendlyAuthError({ name: "NotAuthorizedException", message: "Incorrect username or password." }),
    ).toBe("Incorrect email or password.");
    expect(
      friendlyAuthError({ name: "UserNotFoundException", message: "User does not exist." }),
    ).toBe("Incorrect email or password.");
  });

  it("maps invalid password to the policy requirements", () => {
    const msg = friendlyAuthError({ name: "InvalidPasswordException" });
    expect(msg).toContain("12 characters");
  });

  it("maps rate limiting to a wait message", () => {
    expect(friendlyAuthError({ name: "LimitExceededException" })).toContain("Too many attempts");
  });

  it("maps network failures", () => {
    expect(friendlyAuthError({ name: "NetworkError" })).toContain("reach the server");
  });

  it("falls back to a generic message", () => {
    expect(friendlyAuthError(new Error("boom"))).toBe("Something went wrong. Please try again.");
    expect(friendlyAuthError(null)).toBe("Something went wrong. Please try again.");
  });
});

describe("friendlyApiError", () => {
  it("maps 401 to a session-expired message", () => {
    expect(friendlyApiError(401, {})).toContain("session has expired");
  });

  it("surfaces API validation messages for 400", () => {
    expect(friendlyApiError(400, { errors: ["Missing required field: body"] })).toBe(
      "Missing required field: body",
    );
  });

  it("maps 5xx to a server message", () => {
    expect(friendlyApiError(500, {})).toContain("isn't responding");
  });
});
