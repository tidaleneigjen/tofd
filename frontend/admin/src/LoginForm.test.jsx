import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LoginForm from "./LoginForm";

afterEach(cleanup);

vi.mock("aws-amplify/auth", () => ({
  signIn: vi.fn(),
  confirmSignIn: vi.fn(),
  fetchAuthSession: vi.fn(),
  signOut: vi.fn(),
}));

import { signIn } from "aws-amplify/auth";

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders email and password fields", () => {
    render(<LoginForm onSignedIn={vi.fn()} onNewPasswordRequired={vi.fn()} />);
    expect(screen.getByLabelText("Email")).toBeTruthy();
    expect(screen.getByLabelText("Password")).toBeTruthy();
  });

  it("calls onSignedIn after a successful sign-in", async () => {
    signIn.mockResolvedValue({ isSignedIn: true, nextStep: { signInStep: "DONE" } });
    const onSignedIn = vi.fn();
    render(<LoginForm onSignedIn={onSignedIn} onNewPasswordRequired={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secret" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(onSignedIn).toHaveBeenCalled());
    expect(signIn).toHaveBeenCalledWith({ username: "a@b.com", password: "secret" });
  });

  it("shows a generic error for wrong credentials", async () => {
    signIn.mockRejectedValue({ name: "NotAuthorizedException" });
    render(<LoginForm onSignedIn={vi.fn()} onNewPasswordRequired={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "Incorrect email or password.",
    );
  });

  it("hands off to the new-password step when Cognito requires it", async () => {
    signIn.mockResolvedValue({
      isSignedIn: false,
      nextStep: { signInStep: "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED" },
    });
    const onNewPasswordRequired = vi.fn();
    render(<LoginForm onSignedIn={vi.fn()} onNewPasswordRequired={onNewPasswordRequired} />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "temp" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(onNewPasswordRequired).toHaveBeenCalledWith("a@b.com"));
  });
});
