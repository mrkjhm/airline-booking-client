const stats = [
  { n: "60+", l: "Destinations" },
  { n: "₱0", l: "Booking fee promos" },
  { n: "35M", l: "Guests flown yearly" },
  { n: "4.6★", l: "App store rating" },
];

export function TrustStrip() {
  return (
    <section className="mx-auto max-w-[1200px] px-6 pt-20">
      <div className="flex flex-wrap justify-between gap-6 border-b border-border pb-10 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.l}>
            <p className="font-display text-3xl font-extrabold text-secondary sm:text-4xl">{s.n}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {s.l}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
