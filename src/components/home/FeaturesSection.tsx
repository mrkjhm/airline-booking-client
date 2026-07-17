import { Tag, Clock, ShieldCheck, Globe2 } from "lucide-react";
import type { ReactNode } from "react";

const features: { icon: ReactNode; t: string; d: string }[] = [
  {
    icon: <Tag className="h-6 w-6" />,
    t: "Lowest fares, guaranteed",
    d: "No hidden charges — the price you see at checkout is the price you pay.",
  },
  {
    icon: <Clock className="h-6 w-6" />,
    t: "Web check-in in seconds",
    d: "Skip the queue. Check in online from 24 hours before departure.",
  },
  {
    icon: <ShieldCheck className="h-6 w-6" />,
    t: "Flexible rebooking",
    d: "Change your flight date or destination anytime for a small fee.",
  },
  {
    icon: <Globe2 className="h-6 w-6" />,
    t: "60+ destinations",
    d: "The widest domestic network plus key routes across Asia, the Middle East and beyond.",
  },
];

export function FeaturesSection() {
  return (
    <section className="mx-auto max-w-[1400px] px-6 py-20">
      <div className="mb-10 max-w-lg">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">Why SunJet</p>
        <h2 className="font-display text-3xl font-extrabold text-secondary sm:text-4xl">
          Everything you need, nothing you don't.
        </h2>
      </div>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div
            key={f.t}
            className="rounded-2xl border border-border p-6 transition hover:border-primary hover:shadow-md"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-secondary">
              {f.icon}
            </div>
            <p className="mt-4 font-display text-lg font-extrabold text-secondary">{f.t}</p>
            <p className="mt-2 text-sm text-muted-foreground">{f.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
