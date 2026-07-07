import { redirect } from "next/navigation";
import { getCurrentBusiness } from "@/lib/tenant";
import { getCurrentMember } from "@/lib/auth";
import { SignInForm } from "@/components/auth/SignInForm";
import { MemberPerks } from "@/components/auth/MemberPerks";

export const dynamic = "force-dynamic";

export default async function SignInPage() {
  const business = await getCurrentBusiness();
  if (!business) return null;

  const member = await getCurrentMember(business.id);
  if (member) redirect(member.onboarded ? "/account" : "/onboarding");

  return (
    <main className="mx-auto max-w-5xl px-6 py-14">
      <div className="grid gap-8 lg:grid-cols-2 lg:items-stretch">
        <div className="flex flex-col justify-center py-4">
          <SignInForm />
        </div>
        <MemberPerks businessName={business.name} />
      </div>
    </main>
  );
}
