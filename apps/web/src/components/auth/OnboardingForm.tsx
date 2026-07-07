"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function OnboardingForm({
  defaultFirstName,
  defaultLastName,
}: {
  defaultFirstName: string;
  defaultLastName: string;
}) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(defaultFirstName);
  const [lastName, setLastName] = useState(defaultLastName);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [pending, setPending] = useState(false);

  const canSubmit = ageConfirmed && termsAccepted && privacyAccepted && !pending;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setPending(true);
    try {
      const res = await fetch("/api/v1/account/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          marketingOptIn,
          ageConfirmed,
          termsAccepted,
          privacyAccepted,
        }),
      });
      if (!res.ok) throw new Error();
      router.push("/account");
      router.refresh();
    } catch {
      toast.error("Couldn't finish setting up your account. Please try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-5">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink-muted">First Name *</label>
        <input
          required
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink-muted">Last Name *</label>
        <input
          required
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10"
        />
      </div>

      <div className="space-y-3 pt-2">
        <Checkbox checked={ageConfirmed} onChange={setAgeConfirmed} label="I confirm that I am 18 years old or older. *" />
        <Checkbox checked={termsAccepted} onChange={setTermsAccepted}>
          I have read and agree to the{" "}
          <a href="/terms" target="_blank" className="font-medium text-ink underline">
            Terms of Use
          </a>
          . *
        </Checkbox>
        <Checkbox checked={privacyAccepted} onChange={setPrivacyAccepted}>
          I have read and agree to the{" "}
          <a href="/privacy" target="_blank" className="font-medium text-ink underline">
            Privacy Policy
          </a>
          . *
        </Checkbox>
        <Checkbox
          checked={marketingOptIn}
          onChange={setMarketingOptIn}
          label="Sign me up to receive product tips, offers, and more."
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex-1 rounded-full bg-ink py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {pending ? "Saving…" : "Continue"}
        </button>
      </div>
    </form>
  );
}

function Checkbox({
  checked,
  onChange,
  label,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  children?: ReactNode;
}) {
  return (
    <label className="flex items-start gap-2.5 text-sm text-ink-soft">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-line"
      />
      <span>{children ?? label}</span>
    </label>
  );
}
