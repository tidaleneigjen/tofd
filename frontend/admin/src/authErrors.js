// Maps Amplify/Cognito and API errors to plain-language messages.
// Never surface raw status codes or stack traces to the user.

const GENERIC = "Something went wrong. Please try again.";

export function friendlyAuthError(error) {
  const name = error?.name || "";
  const message = String(error?.message || "").toLowerCase();

  if (
    name.includes("NotAuthorized") ||
    name.includes("UserNotFound") ||
    message.includes("incorrect username or password") ||
    message.includes("not authorized")
  ) {
    // Deliberately identical for wrong password and unknown user.
    return "Incorrect email or password.";
  }
  if (name.includes("UserNotConfirmed") || name.includes("UserLambdaValidation")) {
    return "Your account isn't confirmed yet. Check your email for the verification message.";
  }
  if (name.includes("PasswordResetRequired")) {
    return "Your password has expired. Sign out and use 'Forgot password' to reset it.";
  }
  if (name.includes("InvalidPassword")) {
    return "That password doesn't meet the requirements: at least 12 characters with uppercase, lowercase, a number, and a symbol.";
  }
  if (name.includes("LimitExceeded") || name.includes("TooManyRequests")) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }
  if (name.includes("NetworkError") || name.includes("Timeout") || message.includes("network")) {
    return "Can't reach the server. Check your connection and try again.";
  }
  return GENERIC;
}

export function friendlyApiError(status, body) {
  if (status === 401 || status === 403) {
    return "Your session has expired. Please sign in again.";
  }
  if (status === 404) {
    return "That page couldn't be found.";
  }
  if (status === 400 && Array.isArray(body?.errors) && body.errors.length > 0) {
    return body.errors.join(" ");
  }
  if (status === 0 || status >= 500) {
    return "The server isn't responding right now. Please try again in a moment.";
  }
  return GENERIC;
}
