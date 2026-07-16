import { formatDealPrice } from "@/lib/flight-deals";

export type Deal = {
  city: string;
  price: number;
  img: string;
};

export function DealCard({
  deal,
  tall,
  onSelect,
}: {
  deal: Deal;
  tall?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative block h-56 w-full overflow-hidden rounded-lg text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
        tall ? "md:h-116" : "md:h-56"
      }`}
    >
      <img
        src={deal.img}
        alt={deal.city}
        loading="lazy"
        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="text-xs font-semibold text-white/90">For as low as</p>
        <p className="font-display text-xl font-extrabold text-primary">
          {formatDealPrice(deal.price)}*
        </p>
        <p className="mt-1 font-display text-lg font-extrabold text-white">{deal.city}</p>
      </div>
    </button>
  );
}
