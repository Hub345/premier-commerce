import { redirect } from "next/navigation";
import { getCurrentBusiness } from "@/lib/tenant";
import { getCurrentMember } from "@/lib/auth";
import { OnboardingForm } from "@/components/auth/OnboardingForm";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const business = await getCurrentBusiness();
  if (!business) return null;

  const member = await getCurrentMember(business.id);
  if (!member) redirect("/sign-in");
  if (member.onboarded) redirect("/account");

  const [firstName = "", lastName = ""] = (member.fullName ?? "").split(" ", 2);

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <div className="text-center">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-ink-muted">
          Almost there
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Finish Setting Up Your Account
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Review the information below to complete your {business.name} account setup.
        </p>
      </div>

      <div className="mt-10">
        <OnboardingForm defaultFirstName={firstName} defaultLastName={lastName} />
      </div>
    </main>
  );
}
