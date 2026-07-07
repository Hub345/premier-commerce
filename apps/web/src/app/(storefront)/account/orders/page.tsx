import Link from "next/link";
import { ComingSoon } from "@/components/site/ComingSoon";

export default function AccountOrdersPage() {
  return (
    <div>
      <ComingSoon
        kicker="My Account"
        title="Orders"
        copy="Linking your account to past orders is on its way. Have an order reference already?"
      />
      <div className="mx-auto -mt-8 max-w-xl px-6 pb-16 text-center">
        <Link href="/order-lookup" className="text-sm font-medium text-ink underline">
          Look up an order by reference from your confirmation email
        </Link>
      </div>
    </div>
  );
}
