import { ChevronRight } from "lucide-react";
import tokyoImg from "@/assets/tokyo.jpg";
import newyorkImg from "@/assets/newyork.jpg";
import dubaiImg from "@/assets/dubai.jpg";
import { DealCard, type Deal } from "./DealCard";

const deals: Deal[] = [
  { city: "Tokyo", code: "NRT", country: "Japan", img: tokyoImg, price: "58", sale: "SEAT SALE" },
  { city: "New York", code: "JFK", country: "USA", img: newyorkImg, price: "129", sale: "PISO FARE" },
  { city: "Dubai", code: "DXB", country: "UAE", img: dubaiImg, price: "89", sale: "HOT DEAL" },
];

export function DealsSection() {
  return (
    <section id="deals" className="mx-auto max-w-[1400px] px-6 py-6">
      <div className="mb-8 flex items-end justify-between gap-6">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">Limited time</p>
          <h2 className="font-display text-3xl font-extrabold text-secondary sm:text-4xl">
            This week's seat sale
          </h2>
        </div>
        <a href="#" className="hidden shrink-0 items-center gap-1 text-sm font-bold text-secondary hover:text-primary md:flex">
          View all deals <ChevronRight className="h-4 w-4" />
        </a>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {deals.map((d) => (
          <DealCard key={d.city} d={d} />
        ))}
      </div>
    </section>
  );
}
