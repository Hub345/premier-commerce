import { getCurrentBusiness } from "@/lib/tenant";
import { InfoPage } from "@/components/site/InfoPage";

export default async function PrivacyPage() {
  const business = await getCurrentBusiness();
  const name = business?.name ?? "Premier Commerce";

  return (
    <InfoPage kicker="Legal" title="Privacy Policy">
      <p>
        {name} collects only what&apos;s needed to fulfill your order: your
        name, phone number, delivery address, and — if you choose to pay by
        M-Pesa — the payment reference from Safaricom.
      </p>
      <p>
        We never sell your information. Newsletter subscribers can
        unsubscribe at any time by contacting us.
      </p>
    </InfoPage>
  );
}
