import { useEffect, useState } from "react";
import { Tag } from "lucide-react";
import heroBeachImg from "@/assets/hero-beach.jpg";
import heroCityImg from "@/assets/place.jpg";
import heroPlaneImg from "@/assets/hero-plane.jpg";
import heroCoastImg from "@/assets/hero-coast.jpg";
import { BookingWidget } from "./BookingWidget";

const heroSlideshowImages = [heroPlaneImg, heroBeachImg, heroCityImg, heroCoastImg];
const HERO_SLIDE_INTERVAL_MS = 6000;

export function Hero() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlideshowImages.length);
    }, HERO_SLIDE_INTERVAL_MS);

    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative">
      <div className="relative h-[420px] w-full overflow-hidden sm:h-[480px] md:h-[650px]">
        <div className="absolute inset-0" aria-hidden="true">
          {heroSlideshowImages.map((src, index) => (
            <img
              key={src}
              src={src}
              alt=""
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-2500 ease-in-out will-change-[opacity] ${
                index === activeSlide ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
        </div>

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
