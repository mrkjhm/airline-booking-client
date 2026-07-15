import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/home/Header";
import { Hero } from "@/components/home/Hero";
import { TrustStrip } from "@/components/home/TrustStrip";
import { DealsSection } from "@/components/home/DealsSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { AppPromoBand } from "@/components/home/AppPromoBand";
import { NewsletterSection } from "@/components/home/NewsletterSection";
import { Footer } from "@/components/home/Footer";

type IndexRouteSearch = {
  fromLocation?: string;
  toLocation?: string;
  departureDate?: string;
  returnDate?: string;
};

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): IndexRouteSearch => ({
    fromLocation: parseString(search.fromLocation),
    toLocation: parseString(search.toLocation),
    departureDate: parseString(search.departureDate),
    returnDate: parseString(search.returnDate),
  }),
  component: Index,
  head: () => ({
    meta: [
      { property: "og:image", content: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200" },
    ],
  }),
});

function parseString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-clip">
      <Header />
      <Hero />
      <TrustStrip />
      <DealsSection />
      <FeaturesSection />
      <AppPromoBand />
      <NewsletterSection />
      <Footer />
    </div>
  );
}
