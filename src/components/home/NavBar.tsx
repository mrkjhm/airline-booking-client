import { useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Plane,
  Menu,
  User,
  Search,
  LogOut,
  Ticket,
  Wallet,
  Users,
  Mail,
  Wallet2,
  Gift,
  Settings,
  SlidersHorizontal,
} from "lucide-react";
import { navItems } from "./nav-data";
import { useAuthSession } from "@/hooks/use-auth-session";
import { clearAuthSession, logoutUser } from "@/lib/auth-api";

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

const accountTiles = [
  { label: "My Bookings", to: "/my-bookings" as const, icon: Ticket },
  { label: "Wallet", to: null, icon: Wallet },
  { label: "Guests", to: null, icon: Users },
  { label: "Inbox", to: null, icon: Mail, badge: true },
];

const accountLinks = [
  {
    label: "Travel Fund",
    icon: Wallet2,
    description: "View your available Travel Fund and use it to book flights or add-ons",
  },
  {
    label: "My Vouchers",
    icon: Gift,
    description: "Redeem your travel vouchers before they expire",
  },
  {
    label: "Settings",
    icon: Settings,
    description: "Manage your notification preferences here",
  },
  {
    label: "Add-ons Preferences",
    icon: SlidersHorizontal,
    description:
      "Set your preferences when you upgrade your trip with baggage, meals, seats, and other services",
  },
];

export function NavBar({ scrolled, onMenuClick }: { scrolled: boolean; onMenuClick: () => void }) {
  const textColor = scrolled ? "text-secondary" : "text-white";
  const subTextColor = scrolled ? "text-muted-foreground" : "text-white/70";
  const session = useAuthSession();
  const navigate = useNavigate();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openAccountMenu = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setAccountMenuOpen(true);
  };

  const scheduleCloseAccountMenu = () => {
    closeTimer.current = setTimeout(() => setAccountMenuOpen(false), 150);
  };

  const handleLogout = async () => {
    setAccountMenuOpen(false);
    await logoutUser();
    clearAuthSession();
    await navigate({ to: "/" });
  };

  const navLinkClass = `relative py-2 text-sm font-bold transition-colors duration-300 after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-primary after:transition-all after:duration-300 hover:text-primary hover:after:w-full ${textColor}`;

  return (
    <div
      className={`mx-auto flex max-w-[1400px] items-center justify-between px-6 py-3 transition-colors duration-300 ${
        scrolled ? "border-b border-border" : "border-b border-transparent bg-transparent"
      }`}
    >
      <a href="/" className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Plane className="h-5 w-5 -rotate-45" strokeWidth={2.5} />
        </div>
        <span className="flex flex-col leading-none">
          <span
            className={`font-display text-xl font-extrabold tracking-tight transition-colors duration-300 ${textColor}`}
          >
            Sun<span className="text-primary">Jet</span>
          </span>
          <span
            className={`mt-0.5 text-[11px] font-medium transition-colors duration-300 ${subTextColor}`}
          >
            Fly more, pay less
          </span>
        </span>
      </a>

      <div className="hidden flex-1 items-center justify-center gap-8 lg:flex">
        {navItems.map((l) => (
          <a key={l.label} href={l.href} className={navLinkClass}>
            {l.label}
          </a>
        ))}
      </div>

      <div className="flex items-center gap-5">
        <div
          className="relative hidden self-stretch items-center sm:flex"
          onMouseEnter={openAccountMenu}
          onMouseLeave={scheduleCloseAccountMenu}
        >
          <button
            type="button"
            className={`${navLinkClass} flex items-center gap-2 ${accountMenuOpen ? "text-primary after:w-full" : ""}`}
          >
            {session ? (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {getInitials(session.user.firstName, session.user.lastName)}
              </span>
            ) : (
              <User className="h-4 w-4" />
            )}
            {session ? "My Account" : "Log in"}
          </button>

          {accountMenuOpen && (
            <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-[850px] max-w-[90vw] border border-border bg-white shadow-2xl">
              <div className="px-8 py-7">
                <div className="flex items-start justify-between gap-10">
                  <div className="flex flex-wrap gap-10">
                    {accountTiles.map((tile) => {
                      const tileInner = (
                        <>
                          <span className="relative grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground transition-transform duration-200 hover:scale-105">
                            <tile.icon className="h-6 w-6" />
                            {tile.badge && (
                              <span className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-white" />
                            )}
                          </span>
                          <span className="text-sm font-bold text-secondary">{tile.label}</span>
                        </>
                      );

                      if (tile.to) {
                        return (
                          <Link
                            key={tile.label}
                            to={session ? tile.to : "/login"}
                            onClick={() => setAccountMenuOpen(false)}
                            className="flex flex-col items-center gap-2 text-center"
                          >
                            {tileInner}
                          </Link>
                        );
                      }

                      return (
                        <button
                          key={tile.label}
                          type="button"
                          className="flex flex-col items-center gap-2 text-center"
                        >
                          {tileInner}
                        </button>
                      );
                    })}
                  </div>

                  {session ? (
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex shrink-0 items-center gap-1.5 text-sm font-bold text-secondary transition-colors hover:text-primary"
                    >
                      <LogOut className="h-4 w-4" /> Log out
                    </button>
                  ) : (
                    <div className="w-[240px] shrink-0">
                      <Link
                        to="/login"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex h-12 items-center justify-center rounded-lg bg-secondary px-5 text-sm font-extrabold text-secondary-foreground transition hover:brightness-110"
                      >
                        Log in
                      </Link>
                      <p className="mt-5 text-center text-sm font-medium text-muted-foreground">
                        Not yet a member?{" "}
                        <Link
                          to="/register"
                          onClick={() => setAccountMenuOpen(false)}
                          className="font-extrabold text-secondary hover:text-primary"
                        >
                          Sign up
                        </Link>
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-8 grid grid-cols-2 gap-x-16 gap-y-6 border-t border-border pt-6">
                  {accountLinks.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      className="flex items-start gap-3 text-left"
                    >
                      <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
                      <span>
                        <span className="block text-sm font-bold text-secondary">{item.label}</span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                          {item.description}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <button
          aria-label="Search"
          className={`hidden transition-colors duration-300 hover:text-primary sm:block ${textColor}`}
        >
          <Search className="h-4 w-4" />
        </button>
        <button
          onClick={onMenuClick}
          aria-label="Open menu"
          className={`grid h-10 w-10 place-items-center rounded-full border transition-colors duration-300 lg:hidden ${
            scrolled ? "border-border text-secondary" : "border-white/30 text-white"
          }`}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
