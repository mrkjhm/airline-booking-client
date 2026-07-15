import { Smartphone } from "lucide-react";
import dubaiImg from "@/assets/dubai.jpg";

export function AppPromoBand() {
  return (
    <section className="bg-abyss">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-10 px-6 py-16 lg:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
            <Smartphone className="h-3.5 w-3.5" /> SunJet App
          </span>
          <h2 className="mt-5 font-display text-3xl font-extrabold text-white sm:text-4xl">
            App-exclusive fares, dropped weekly.
          </h2>
          <p className="mt-4 max-w-md text-sm text-white/70">
            Get push alerts on seat sales, manage bookings on the go, and check in without printing a thing.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-abyss transition hover:bg-primary">
              Download on the App Store
            </button>
            <button className="rounded-xl border border-white/30 px-5 py-3 text-sm font-bold text-white transition hover:border-white">
              Get it on Google Play
            </button>
          </div>
        </div>
        <div className="relative mx-auto aspect-4/3 w-full max-w-md overflow-hidden rounded-2xl">
          <img src={dubaiImg} alt="Explore with SunJet" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-linear-to-t from-abyss/60 via-transparent to-transparent" />
        </div>
      </div>
    </section>
  );
}
