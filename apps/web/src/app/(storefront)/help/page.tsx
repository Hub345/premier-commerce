import { InfoPage } from "@/components/site/InfoPage";

export default function HelpPage() {
  return (
    <InfoPage kicker="Support" title="Help Center">
      <p>
        Most questions about orders, delivery, and payment are answered in
        your order confirmation email and SMS updates.
      </p>
      <p>
        For anything else — returns, warranty claims, or product advice —
        reach our team on the{" "}
        <a href="/contact" className="font-medium text-ink hover:underline">
          Contact Us
        </a>{" "}
        page and we&apos;ll take it from there.
      </p>
    </InfoPage>
  );
}
