import { getCurrentBusiness } from "@/lib/tenant";
import { InfoPage } from "@/components/site/InfoPage";

export default async function TermsPage() {
  const business = await getCurrentBusiness();
  const name = business?.name ?? "Premier Commerce";

  return (
    <InfoPage kicker="Legal" title="Terms of Use">
      <p>
        By ordering from {name}, you agree to pay the listed price at
        checkout, plus VAT where it applies. Orders are confirmed once
        payment is received or, for pay-on-delivery, once the courier hands
        over your item.
      </p>
      <p>
        Returns are accepted within 14 days of delivery on unused items in
        their original packaging, subject to the manufacturer&apos;s
        warranty terms.
      </p>
    </InfoPage>
  );
}
