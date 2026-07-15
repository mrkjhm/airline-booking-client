import { Plane, Facebook, Instagram, Twitter, Youtube } from "lucide-react";

const footerCols = [
  { t: "Book", i: ["Flights", "Hotels", "Vacation Packages", "Travel Insurance", "Group Bookings"] },
  { t: "Manage", i: ["My Trips", "Web Check-in", "Flight Status", "Refund Request", "Baggage Info"] },
  { t: "About SunJet", i: ["Our Story", "Careers", "Newsroom", "Investor Relations", "Sustainability"] },
  { t: "Support", i: ["Help Centre", "Contact Us", "GetMore Rewards", "Corporate Travel", "Feedback"] },
];

const socialIcons = [Facebook, Instagram, Twitter, Youtube];

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary text-white">
      <div className="mx-auto max-w-[1400px] px-6 py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-6">
          <div className="col-span-2 max-w-xs">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Plane className="h-4 w-4 -rotate-45" strokeWidth={2.5} />
              </div>
              <span className="font-display text-xl font-extrabold">Sun<span className="text-primary">Jet</span></span>
            </div>
            <p className="mt-4 text-sm text-white/60">
              Low fares, everyday flights. Flying to 60+ destinations across Asia, the Middle East and beyond.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {socialIcons.map((Icon, i) => (
                <a key={i} href="#" className="grid h-9 w-9 place-items-center rounded-full border border-white/20 text-white/70 transition hover:border-primary hover:text-primary">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          {footerCols.map((c) => (
            <div key={c.t}>
              <p className="text-xs font-bold uppercase tracking-wide text-primary">{c.t}</p>
              <ul className="mt-4 space-y-2.5 text-sm text-white/70">
                {c.i.map((x) => (
                  <li key={x}><a href="#" className="hover:text-white">{x}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/50 md:flex-row md:items-center">
          <p>© 2026 SunJet Airlines. All rights reserved. This is a demo booking site.</p>
          <div className="flex gap-5">
            <a href="#" className="hover:text-white">Terms of Use</a>
            <a href="#" className="hover:text-white">Privacy Policy</a>
            <a href="#" className="hover:text-white">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
