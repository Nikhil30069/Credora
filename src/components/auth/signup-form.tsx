"use client";

import { LoginForm } from "./login-form";

/** Signup is now handled via Google OAuth — same as login. */
export function SignupForm() {
  return <LoginForm />;
}
