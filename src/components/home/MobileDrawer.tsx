import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Plane, X, ChevronDown, User, LogOut } from "lucide-react";
import { accountLinks, accountTiles, navItems } from "./nav-data";
import { useAuthSession } from "@/hooks/use-auth-session";
import { clearAuthSession, logoutUser } from "@/lib/auth-api";

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const session = useAuthSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) {
      setOpenItem(null);
      setAccountOpen(false);
    }
  }, [open]);

  const handleLogout = async () => {
    await logoutUser();
    clearAuthSession();
    onClose();
    await navigate({ to: "/" });
  };

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-abyss/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-80 max-w-[85vw] flex-col bg-white text-secondary shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Plane className="h-4 w-4 -rotate-45" strokeWidth={2.5} />
            </div>
            <span className="flex flex-col leading-none">
              <span className="font-display text-lg font-extrabold tracking-tight text-secondary">
                Sun<span className="text-primary">Jet</span>
              </span>
              <span className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                Fly more, pay less
              </span>
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="grid h-9 w-9 place-items-center rounded-full border border-border text-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-5 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.label} className="border-b border-border last:border-0">
                {item.children ? (
                  <>
                    <button
                      onClick={() => setOpenItem(openItem === item.label ? null : item.label)}
                      className="flex w-full items-center justify-between py-3 text-left text-sm font-semibold text-secondary"
                    >
                      {item.label}
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${openItem === item.label ? "rotate-180" : ""}`}
                      />
                    </button>
                    <ul
                      className={`overflow-hidden transition-all duration-200 ${
                        openItem === item.label ? "max-h-48 pb-2" : "max-h-0"
                      }`}
                    >
                      {item.children.map((c) => (
                        <li key={c.label}>
                          <a
                            href={c.href}
                            className="block py-2 pl-3 text-sm text-muted-foreground hover:text-secondary"
                          >
                            {c.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <a href={item.href} className="block py-3 text-sm font-semibold text-secondary">
                    {item.label}
                  </a>
                )}
              </li>
            ))}
          </ul>

          {session ? (
            <div className="mt-5">
              <button
                type="button"
                onClick={() => setAccountOpen((prev) => !prev)}
                className="flex w-full items-center justify-between gap-2.5 rounded-full bg-muted px-4 py-2.5"
              >
                <span className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {getInitials(session.user.firstName, session.user.lastName)}
                  </span>
                  <span className="text-sm font-bold text-secondary">My Account</span>
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-secondary transition-transform duration-200 ${accountOpen ? "rotate-180" : ""}`}
                />
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ease-out ${
                  accountOpen ? "max-h-[640px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="mt-4 flex flex-col gap-5">
                  <div className="grid grid-cols-2 gap-3">
                    {accountTiles.map((tile) => {
                      const tileInner = (
                        <>
                          <span className="relative grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground">
                            <tile.icon className="h-5 w-5" />
                            {tile.badge && (
                              <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-accent ring-2 ring-white" />
                            )}
                          </span>
                          <span className="text-xs font-bold text-secondary">{tile.label}</span>
                        </>
                      );

                      return tile.to ? (
                        <Link
                          key={tile.label}
                          to={tile.to}
                          onClick={onClose}
                          className="flex flex-col items-center gap-1.5 rounded-lg py-2 text-center transition hover:bg-muted"
                        >
                          {tileInner}
                        </Link>
                      ) : (
                        <button
                          key={tile.label}
                          type="button"
                          className="flex flex-col items-center gap-1.5 rounded-lg py-2 text-center transition hover:bg-muted"
                        >
                          {tileInner}
                        </button>
                      );
                    })}
                  </div>

                  <ul className="flex flex-col divide-y divide-border border-y border-border">
                    {accountLinks.map((item) => (
                      <li key={item.label}>
                        <button
                          type="button"
                          className="flex w-full items-start gap-3 py-3 text-left"
                        >
                          <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                          <span>
                            <span className="block text-sm font-bold text-secondary">
                              {item.label}
                            </span>
                            <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                              {item.description}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full border border-border px-5 py-2.5 text-sm font-bold text-secondary transition hover:bg-muted"
              >
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={onClose}
              className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:brightness-95"
            >
              <User className="h-4 w-4" /> Log in
            </Link>
          )}
        </nav>
      </div>
    </>
  );
}
