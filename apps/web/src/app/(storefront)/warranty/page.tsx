import { InfoPage } from "@/components/site/InfoPage";

export default function WarrantyPage() {
  return (
    <InfoPage kicker="Support" title="Warranties">
      <p>
        Every product we sell is authorized stock, backed by its
        manufacturer&apos;s full warranty — never a grey-market import.
      </p>
      <p>
        Keep your order confirmation as proof of purchase; it&apos;s all
        you&apos;ll need for a warranty claim. Reach out via{" "}
        <a href="/contact" className="font-medium text-ink hover:underline">
          Contact Us
        </a>{" "}
        and we&apos;ll guide you through the manufacturer&apos;s process.
      </p>
    </InfoPage>
  );
}
