const errors = {
  generic: "Something went wrong",
  needsLogin: "You must sign in first.",
  requestFailed: "Request failed",
  invalidLogin: "Invalid sign-in response",
  missingChallenge: "Error: missing challenge",
} as const;

export default errors;
