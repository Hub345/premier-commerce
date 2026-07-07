import { getCurrentBusiness } from "@/lib/tenant";
import { InfoPage } from "@/components/site/InfoPage";

export default async function ContactPage() {
  const business = await getCurrentBusiness();
  const contact = business?.contact;

  return (
    <InfoPage kicker="Support" title="Contact Us">
      <p>Have a question about an order, a product, or a warranty claim? Reach us directly:</p>
      <ul className="space-y-2">
        {contact?.phone ? (
          <li>
            <span className="text-ink-muted">Phone: </span>
            <a href={`tel:${contact.phone}`} className="font-medium text-ink hover:underline">
              {contact.phone}
            </a>
          </li>
        ) : null}
        {contact?.email ? (
          <li>
            <span className="text-ink-muted">Email: </span>
            <a href={`mailto:${contact.email}`} className="font-medium text-ink hover:underline">
              {contact.email}
            </a>
          </li>
        ) : null}
      </ul>
      <p>We aim to respond to every message within one business day.</p>
    </InfoPage>
  );
}
