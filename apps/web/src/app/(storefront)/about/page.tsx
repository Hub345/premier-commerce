import { getCurrentBusiness } from "@/lib/tenant";
import { InfoPage } from "@/components/site/InfoPage";

export default async function AboutPage() {
  const business = await getCurrentBusiness();
  const name = business?.name ?? "Premier Commerce";

  return (
    <InfoPage kicker="About Us" title={`About ${name}`}>
      <p>
        {name} brings genuine, authentic electronics to customers across
        Kenya — phones, televisions, computers, audio and home appliances
        from the brands you trust.
      </p>
      <p>
        We stock authorized inventory only, back every sale with a full
        manufacturer&apos;s warranty, and deliver countrywide with
        pay-on-delivery so you can inspect before you pay.
      </p>
    </InfoPage>
  );
}
