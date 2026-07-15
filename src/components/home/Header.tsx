import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { UtilityBar } from "./UtilityBar";
import { NavBar } from "./NavBar";
import { MobileDrawer } from "./MobileDrawer";

export function Header() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isHome = pathname === "/";

  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const active = isHome ? scrolled || hovered : true;

  return (
    <header
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        active ? "bg-background shadow-md" : "bg-transparent"
      }`}
    >
      <UtilityBar scrolled={active} />
      <NavBar scrolled={active} onMenuClick={() => setDrawerOpen(true)} />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </header>
  );
}
