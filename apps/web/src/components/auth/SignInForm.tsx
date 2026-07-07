"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { getBrowserSupabase, isAuthAvailable } from "@/lib/supabase/client";

const PREVIEW_MESSAGE =
  "Accounts need a connected database — sign-in is disabled in this preview.";

type Mode = "sign-in" | "sign-up";

// Supabase's raw error text is honest but cold — translate the common ones
// into something a person would actually want to read in a toast.
function humanizeError(message: string): string {
  if (/invalid login credentials/i.test(message)) {
    return "We couldn't find an account with that email and password. Try again?";
  }
  if (/user already registered/i.test(message)) {
    return "Looks like you already have an account — try signing in instead.";
  }
  if (/password should be at least/i.test(message)) {
    return "Your password needs to be at least 6 characters.";
  }
  return "Something went wrong on our end. Please try again in a moment.";
}

export function SignInForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [stayIn, setStayIn] = useState(true);
  const [pending, setPending] = useState(false);
  const authReady = isAuthAvailable();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (pending) return;
    if (!authReady) {
      toast.error(PREVIEW_MESSAGE);
      return;
    }
    setPending(true);
    const supabase = getBrowserSupabase();

    const { error } =
      mode === "sign-in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (error) {
      toast.error(humanizeError(error.message));
      setPending(false);
      return;
    }

    if (mode === "sign-up") {
      toast.success("Check your inbox to confirm your email, then sign in.");
      setMode("sign-in");
      setPending(false);
      return;
    }

    router.push("/onboarding");
    router.refresh();
  }

  async function handleGoogle() {
    if (!authReady) {
      toast.error(PREVIEW_MESSAGE);
      return;
    }
    const supabase = getBrowserSupabase();
    const redirectTo = `${window.location.origin}/auth/callback`;
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
  }

  return (
    <div>
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, x: mode === "sign-in" ? -16 : 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: mode === "sign-in" ? 16 : -16 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <h1 className="text-3xl font-bold tracking-tight" style={{ letterSpacing: "-0.01em" }}>
            {mode === "sign-in" ? "Sign In" : "Sign Up"}
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            {mode === "sign-in"
              ? "Welcome back — good to see you."
              : "Takes less than a minute."}
          </p>

          {!authReady ? (
            <p className="mt-4 rounded-xl border border-line bg-paper px-4 py-3 text-xs text-ink-muted">
              Preview mode — accounts need a connected Supabase database. The form
              below is inactive until one is configured.
            </p>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-muted">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-muted">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10"
              />
            </div>

            {mode === "sign-in" ? (
              <label className="flex items-center gap-2 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  checked={stayIn}
                  onChange={(e) => setStayIn(e.target.checked)}
                  className="h-4 w-4 rounded border-line"
                />
                Stay signed in
              </label>
            ) : null}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-full bg-ink py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Please wait…" : mode === "sign-in" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <span className="text-xs text-ink-muted">or</span>
            <div className="h-px flex-1 bg-line" />
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogle}
              className="flex w-full items-center justify-center gap-2.5 rounded-full border border-line bg-surface py-3 text-sm font-medium text-ink transition-colors hover:bg-paper"
            >
              <GoogleMark />
              Continue with Google
            </button>
            <button
              type="button"
              disabled
              title="Apple Sign-In is coming soon"
              className="flex w-full cursor-not-allowed items-center justify-center gap-2.5 rounded-full border border-line bg-surface py-3 text-sm font-medium text-ink-muted opacity-60"
            >
              <AppleMark />
              Continue with Apple — coming soon
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-ink-soft">
            {mode === "sign-in" ? "Don't have an account?" : "Already a member?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
              className="font-semibold text-ink hover:underline"
            >
              {mode === "sign-in" ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.47a5.54 5.54 0 01-2.4 3.63v3h3.89c2.27-2.09 3.58-5.17 3.58-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.89-3c-1.08.73-2.46 1.16-4.06 1.16-3.12 0-5.77-2.11-6.71-4.94H1.28v3.1A12 12 0 0012 24z" />
      <path fill="#FBBC05" d="M5.29 14.31A7.2 7.2 0 014.9 12c0-.8.14-1.58.39-2.31v-3.1H1.28A12 12 0 000 12c0 1.94.46 3.77 1.28 5.4z" />
      <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 001.28 6.6l4.01 3.1C6.23 6.86 8.88 4.75 12 4.75z" />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.365 1.43c0 1.14-.47 2.28-1.16 3.11-.75.9-1.98 1.6-3 1.51-.13-1.09.44-2.25 1.11-2.96.77-.83 2.06-1.47 3.05-1.66zM20.9 17.32c-.55 1.27-.82 1.84-1.53 2.96-1 1.57-2.4 3.53-4.14 3.55-1.55.02-1.95-1.01-4.05-1-2.1.01-2.54 1.02-4.1 1-1.75-.02-3.07-1.78-4.07-3.35-2.8-4.3-3.1-9.35-1.37-12.04 1.23-1.91 3.17-3.03 4.99-3.03 1.86 0 3.03 1.02 4.57 1.02 1.49 0 2.4-1.02 4.55-1.02 1.62 0 3.34.88 4.56 2.4-4.01 2.2-3.36 7.93.59 9.51z" />
    </svg>
  );
}
