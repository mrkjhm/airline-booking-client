import { Gift, Mail, Settings, SlidersHorizontal, Ticket, Users, Wallet, Wallet2 } from "lucide-react";
import type { ComponentType } from "react";

export type NavItem = {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
};

export const navItems: NavItem[] = [
  { label: "Book", href: "#" },
  {
    label: "Manage",
    href: "#",
    children: [
      { label: "My Trips", href: "#" },
      { label: "Web Check-in", href: "#" },
      { label: "Flight Status", href: "#" },
    ],
  },
  { label: "Travel Info", href: "#" },
  { label: "Explore", href: "#" },
  { label: "About", href: "#" },
];

export type AccountTile = {
  label: string;
  to: "/my-bookings" | null;
  icon: ComponentType<{ className?: string }>;
  badge?: boolean;
};

export const accountTiles: AccountTile[] = [
  { label: "My Bookings", to: "/my-bookings", icon: Ticket },
  { label: "Wallet", to: null, icon: Wallet },
  { label: "Guests", to: null, icon: Users },
  { label: "Inbox", to: null, icon: Mail, badge: true },
];

export type AccountLink = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  description: string;
};

export const accountLinks: AccountLink[] = [
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
