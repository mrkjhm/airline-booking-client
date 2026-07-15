import { ArrowRight } from "lucide-react";

export type Deal = {
  city: string;
  code: string;
  country: string;
  img: string;
  price: string;
  sale: string;
};

export function DealCard({ d }: { d: Deal }) {
  return (
    <a href="#" className="group relative block overflow-hidden rounded-2xl border border-border shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative h-56 w-full overflow-hidden">
        <img src={d.img} alt={d.city} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        <span className="absolute left-4 top-4 rounded-full bg-accent px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white">
          {d.sale}
        </span>
      </div>
      <div className="bg-card p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{d.country} · {d.code}</p>
        <div className="mt-1 flex items-end justify-between gap-2">
          <h3 className="font-display text-xl font-extrabold text-secondary">{d.city}</h3>
          <p className="text-right">
            <span className="block text-[10px] font-semibold uppercase text-muted-foreground">from</span>
            <span className="font-display text-2xl font-extrabold text-secondary">${d.price}</span>
          </p>
        </div>
        <div className="mt-3 flex items-center gap-1 text-sm font-bold text-primary">
          Book now <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </div>
      </div>
    </a>
  );
}
