import { getCurrentBusiness } from "@/lib/tenant";
import { getCategoriesForAdmin, getProductsForAdmin } from "@/lib/catalog";
import { getSessionUser, isBusinessAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const business = await getCurrentBusiness();
  if (!business) return null;

  const user = await getSessionUser();
  if (!user) {
    return (
      <AccessNotice
        title="Sign in required"
        body="The Command Center needs a real session. Sign in with the account you want to administer with, then come back here."
        cta={{ href: "/sign-in", label: "Sign In" }}
      />
    );
  }

  const authorized = await isBusinessAdmin(business.id);
  if (!authorized) {
    return (
      <AccessNotice
        title="Access restricted"
        body={`${user.email ?? "This account"} isn't a member of ${business.name} yet. Grant access with the service role (run once, from your own machine — never expose this in client code):`}
        sql={`insert into business_members (business_id, profile_id, role)\nvalues ('${business.id}', '${user.id}', 'owner');`}
      />
    );
  }

  const [categories, products] = await Promise.all([
    getCategoriesForAdmin(business.id),
    getProductsForAdmin(business.id),
  ]);

  return <AdminShell business={business} categories={categories} products={products} />;
}

function AccessNotice({
  title,
  body,
  cta,
  sql,
}: {
  title: string;
  body: string;
  cta?: { href: string; label: string };
  sql?: string;
}) {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-zinc-100"
      style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
    >
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500">
          Zenith Command Center
        </p>
        <h1 className="mt-2 text-xl font-semibold">{title}</h1>
        <p className="mt-3 text-sm text-zinc-400">{body}</p>
        {sql ? (
          <pre className="mt-4 overflow-x-auto rounded-lg border border-zinc-800 bg-black p-3 font-mono text-[11px] text-emerald-400">
            {sql}
          </pre>
        ) : null}
        {cta ? (
          <a
            href={cta.href}
            className="mt-5 inline-flex rounded-lg bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-950"
          >
            {cta.label}
          </a>
        ) : null}
      </div>
    </div>
  );
}
