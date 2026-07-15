import { Tag } from "lucide-react";
import planeImg from "@/assets/plane.jpg";
import { BookingWidget } from "./BookingWidget";

export function Hero() {
  return (
    <section className="relative">
      <div className="relative h-[420px] w-full overflow-hidden sm:h-[480px] md:h-[580px]">
        <img
          src={planeImg}
          alt="Aircraft crossing the sky"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-abyss via-abyss/40 to-abyss/10" />
        <div className="absolute inset-0 flex flex-col justify-center px-6">
          <div className="mx-auto w-full max-w-[1400px]">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/95 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-primary-foreground">
              <Tag className="h-3.5 w-3.5" /> Seat Sale · Book till July 20
            </span>
            <h1 className="mt-5 max-w-2xl font-display text-4xl font-extrabold leading-[1.05] text-white sm:text-5xl md:text-6xl">
              Fly more, <span className="text-primary">pay less.</span>
            </h1>
            <p className="mt-4 max-w-md text-base text-white/85">
              Everyday low fares to 60+ destinations. Book direct and skip the fees.
            </p>
          </div>
        </div>
      </div>

      {/* BOOKING WIDGET — overlaps hero */}
      <BookingWidget />
    </section>
  );
}
