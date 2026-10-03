"use client";

import { useState, type FormEvent } from "react";
import { clearLegacyData, readLegacyData } from "@/lib/storage";

export type AuthUser = { id: string; username: string; displayName: string };
type AuthViewProps = { onAuthenticated: (user: AuthUser) => Promise<void> };
type AuthMode = "login" | "signup" | "reset";

export default function AuthView({ onAuthenticated }: AuthViewProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setBusy(true);
    try {
      const action = mode === "login" ? "login" : mode === "signup" ? "signup" : "reset-password";
      const body: Record<string, unknown> = { action, username: username.trim() };
      if (mode === "signup") {
        body.displayName = displayName.trim();
        body.password = password;
        body.legacyData = readLegacyData();
      } else if (mode === "login") {
        body.password = password;
      } else {
        body.newPassword = newPassword;
      }

      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      const result = await response.json() as { error?: string; user?: AuthUser; ok?: boolean };
      if (!response.ok) throw new Error(result.error || "Unable to complete that request.");

      if (mode === "reset") {
        setMode("login");
        setPassword("");
        setNewPassword("");
        setMessage("Password reset. Sign in with your new password.");
        return;
      }
      if (!result.user) throw new Error("The account could not be loaded.");
      if (mode === "signup") clearLegacyData();
      await onAuthenticated(result.user);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to connect to LifeOS.");
    } finally {
      setBusy(false);
    }
  }

  const title = mode === "login" ? "Welcome back" : mode === "signup" ? "Create your space" : "Reset password";
  return <main className="auth-shell">
    <section className="auth-panel">
      <div className="setup-brand"><span className="brand-mark">L</span><span className="setup-brand-text">LIFE<span>OS</span></span></div>
      <p className="eyebrow">YOUR PERSONAL WORKSPACE</p>
      <h1>{title}</h1>
      <p className="auth-subtitle">{mode === "login" ? "Sign in to continue to your saved records." : mode === "signup" ? "Create a username and password to get started." : "Choose a username and set a new password."}</p>
      <form className="auth-form" onSubmit={submit}>
        {mode === "signup" && <label>Your name<input required autoComplete="name" maxLength={80} value={displayName} onChange={event => setDisplayName(event.target.value)} /></label>}
        <label>Username<input required autoComplete="username" minLength={3} maxLength={32} value={username} onChange={event => setUsername(event.target.value)} /></label>
        {mode === "login" && <label>Password<input required type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} /></label>}
        {mode === "signup" && <label>Password<input required type="password" autoComplete="new-password" minLength={6} value={password} onChange={event => setPassword(event.target.value)} /></label>}
        {mode === "reset" && <label>New password<input required type="password" autoComplete="new-password" minLength={6} value={newPassword} onChange={event => setNewPassword(event.target.value)} /></label>}
        {message && <p className="auth-message" role="alert">{message}</p>}
        <button className="primary-button auth-submit" type="submit" disabled={busy}>{busy ? "Please wait..." : mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Reset password"}</button>
      </form>
      <div className="auth-links">
        {mode === "login" && <><button type="button" onClick={() => { setMode("signup"); setMessage(""); }}>Create an account</button><button type="button" onClick={() => { setMode("reset"); setMessage(""); }}>Forgot password?</button></>}
        {mode !== "login" && <button type="button" onClick={() => { setMode("login"); setMessage(""); }}>Back to sign in</button>}
      </div>
    </section>
  </main>;
}
