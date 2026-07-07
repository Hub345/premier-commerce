import type { BusinessBenefit, FontChoice } from "@premier/protocol";

// The "Zenith Factory" settings — what the Stage Manager's "Restore to
// Default" button re-applies. Mirrors the seed values in
// supabase/migrations/0002_seed_bizrah.sql / 0008_stage_manager.sql.
export const ZENITH_DEFAULTS: {
  accent: string;
  primary: string;
  fontFamily: FontChoice;
  tagline: string;
  heroHeadline: string;
  heroSubcopy: string;
  benefits: BusinessBenefit[];
} = {
  accent: "#D8A24A",
  primary: "#161613",
  fontFamily: "geist",
  tagline: "Premium electronics, delivered across Kenya.",
  heroHeadline: "Technology worth the upgrade.",
  heroSubcopy:
    "Phones, televisions, computers and appliances from the brands you trust — with M-Pesa checkout and countrywide delivery.",
  benefits: [
    {
      title: "Lightning Delivery",
      copy: "Free same-day delivery in Nairobi and its environs. From our warehouse to your door in hours.",
    },
    {
      title: "Pay on Your Terms",
      copy: "Payment on Delivery. Inspect your tech, then pay via M-Pesa or Cash.",
    },
    {
      title: "White-Glove Setup",
      copy: "Free Installation & Setup. We don't just drop off boxes; we calibrate your experience.",
    },
    {
      title: "Genuine Warranty",
      copy: "Certified Authentic. Every product backed by a full manufacturer's warranty.",
    },
  ],
};
