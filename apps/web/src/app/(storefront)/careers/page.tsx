import { getCurrentBusiness } from "@/lib/tenant";
import { InfoPage } from "@/components/site/InfoPage";

export default async function CareersPage() {
  const business = await getCurrentBusiness();
  const contact = business?.contact;

  return (
    <InfoPage kicker="Company" title="Careers">
      <p>
        We&apos;re not currently listing open roles, but we&apos;re always
        glad to hear from people who care about doing right by customers.
      </p>
      {contact?.email ? (
        <p>
          Send your CV to{" "}
          <a href={`mailto:${contact.email}`} className="font-medium text-ink hover:underline">
            {contact.email}
          </a>
          .
        </p>
      ) : null}
    </InfoPage>
  );
}
