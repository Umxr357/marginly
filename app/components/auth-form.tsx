"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, Eye, EyeOff } from "lucide-react";
import { api } from "../lib/client";

function safeReturnTo(value: string) {
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u001f\u007f]/.test(value)
  )
    return "/";
  const destination = new URL(value, window.location.origin);
  return destination.origin === window.location.origin
    ? `${destination.pathname}${destination.search}${destination.hash}`
    : "/";
}

export function AuthForm({ returnTo }: { returnTo: string }) {
  const [register, setRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      document.documentElement.dataset.theme =
        localStorage.getItem("marginly-theme") ??
        (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    } catch {
      /* A stored theme is optional. */
    }
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await api(`/api/auth/${register ? "register" : "login"}`, {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          password,
          ...(register ? { name: name.trim() } : {}),
        }),
      });
      window.location.assign(safeReturnTo(returnTo));
    } catch (err) {
      setError((err as Error).message);
      setPending(false);
    }
  }

  return (
    <div className="auth-page">
      <header className="auth-header">
        <a className="brand" href="/" aria-label="Marginly home">
          marginly<span aria-hidden="true">✳</span>
        </a>
        <a className="auth-back" href="/">
          <ArrowLeft size={16} /> Back to the journal
        </a>
      </header>
      <main className="auth-layout">
        <section className="auth-intro" aria-labelledby="auth-intro-title">
          <div className="eyebrow">A LITTLE ROOM FOR YOUR IDEAS</div>
          <h1 id="auth-intro-title">
            Your words.
            <br />
            <em>
              Your corner
              <br />
              of the world.
            </em>
          </h1>
          <p>
            Save a story. Start a conversation. Share a perspective only you can
            bring.
          </p>
          <div className="auth-art" aria-hidden="true">
            <span>✳</span>
            <i />
            <b>
              THOUGHTS
              <br />
              WORTH KEEPING.
            </b>
          </div>
        </section>
        <section className="auth-card" aria-labelledby="auth-title">
          <div className="eyebrow">
            {register ? "MAKE YOURSELF AT HOME" : "GOOD TO HAVE YOU HERE"}
          </div>
          <h2 id="auth-title">
            {register ? "A fresh beginning." : "Welcome back."}
          </h2>
          <p className="auth-description">
            {register
              ? "Create your Marginly account and make your first mark."
              : "Your reading list and unfinished ideas are waiting."}
          </p>
          <form onSubmit={submit} aria-busy={pending}>
            <fieldset disabled={pending}>
              {register && (
                <label htmlFor="auth-name">
                  Your name
                  <input
                    id="auth-name"
                    name="name"
                    autoComplete="name"
                    minLength={2}
                    maxLength={80}
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="How should we call you?"
                  />
                </label>
              )}
              <label htmlFor="auth-email">
                Email address
                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                />
              </label>
              <label htmlFor="auth-password">
                Password
                <span className="auth-password">
                  <input
                    id="auth-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={
                      register ? "new-password" : "current-password"
                    }
                    minLength={10}
                    maxLength={128}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    aria-describedby={register ? "password-help" : undefined}
                  />
                  <button
                    type="button"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </span>
              </label>
              {register && (
                <p className="auth-hint" id="password-help">
                  Use at least 10 characters.
                </p>
              )}
              {error && (
                <p className="error-banner" role="alert">
                  {error}
                </p>
              )}
              <button className="primary auth-submit" type="submit">
                {pending
                  ? register
                    ? "Creating your account…"
                    : "Signing in…"
                  : register
                    ? "Create account"
                    : "Sign in"}{" "}
                {!pending && <ArrowUpRight size={18} />}
              </button>
            </fieldset>
          </form>
          <p className="auth-switch">
            {register ? "Already have an account?" : "New around here?"}{" "}
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setRegister(!register);
                setError("");
                setPassword("");
                setShowPassword(false);
              }}
            >
              {register ? "Sign in" : "Create an account"}
            </button>
          </p>
          <p className="auth-note">Reading is always open to everyone.</p>
        </section>
      </main>
      <footer className="auth-footer">
        <span>A little perspective goes a long way.</span>
        <span>© 2026 Marginly</span>
      </footer>
    </div>
  );
}
