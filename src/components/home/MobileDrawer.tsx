import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Plane, X, ChevronDown, Phone, Mail, User, LogOut } from "lucide-react";
import { navItems } from "./nav-data";
import { useAuthSession } from "@/hooks/use-auth-session";
import { clearAuthSession, logoutUser } from "@/lib/auth-api";

const languages = [
  { code: "EN", flag: "🇺🇸" },
  { code: "PH", flag: "🇵🇭" },
];

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [lang, setLang] = useState("EN");
  const session = useAuthSession();
  const navigate = useNavigate();

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
        className={`fixed inset-y-0 right-0 z-50 flex w-80 max-w-[85vw] flex-col bg-abyss text-white shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Plane className="h-4 w-4 -rotate-45" strokeWidth={2.5} />
          </div>
          <button onClick={onClose} aria-label="Close menu" className="grid h-9 w-9 place-items-center rounded-full border border-white/20">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-5 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.label} className="border-b border-white/10 last:border-0">
                {item.children ? (
                  <>
                    <button
                      onClick={() => setOpenItem(openItem === item.label ? null : item.label)}
                      className="flex w-full items-center justify-between py-3 text-left text-sm font-semibold"
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
                          <a href={c.href} className="block py-2 pl-3 text-sm text-white/70 hover:text-white">
                            {c.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <a href={item.href} className="block py-3 text-sm font-semibold">
                    {item.label}
                  </a>
                )}
              </li>
            ))}
          </ul>

          {session ? (
            <div className="mt-5 flex flex-col gap-2">
              <div className="flex items-center gap-2.5 rounded-full bg-white/10 px-4 py-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {getInitials(session.user.firstName, session.user.lastName)}
                </span>
                <span className="text-sm font-bold">My Account</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-1.5 rounded-full border border-white/20 px-5 py-2.5 text-sm font-bold text-white/90 transition hover:bg-white/10"
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

        <div className="border-t border-white/10 px-5 py-4 text-xs text-white/70">
          <a href="tel:+63287020888" className="flex items-center gap-1.5 py-1 hover:text-primary">
            <Phone className="h-3.5 w-3.5" /> +63 2 8702 0888
          </a>
          <a href="mailto:support@sunjet.example" className="flex items-center gap-1.5 py-1 hover:text-primary">
            <Mail className="h-3.5 w-3.5" /> support@sunjet.example
          </a>
          <div className="mt-3 flex items-center gap-1 rounded-full border border-white/20 p-0.5 w-fit">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold transition ${
                  lang === l.code ? "bg-primary text-primary-foreground" : "text-white/70 hover:text-white"
                }`}
              >
                <span>{l.flag}</span> {l.code}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
