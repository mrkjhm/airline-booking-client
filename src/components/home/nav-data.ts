import {
  BadgePercent,
  Building2,
  CalendarClock,
  Compass,
  Gift,
  Globe2,
  Landmark,
  Luggage,
  Mail,
  MapPinned,
  Newspaper,
  PlaneTakeoff,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Ticket,
  Users,
  Wallet,
  Wallet2,
} from "lucide-react";
import type { ComponentType } from "react";

export type NavChild = {
  label: string;
  href: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
};

export type NavItem = {
  label: string;
  href: string;
  description: string;
  children: NavChild[];
};

export const navItems: NavItem[] = [
  {
    label: "Book",
    href: "#",
    description: "Find and book flights to your next destination at the best fare.",
    children: [
      {
        label: "Book a Flight",
        href: "#",
        description: "Search one-way, round-trip, or multi-city flights in seconds",
        icon: PlaneTakeoff,
      },
      {
        label: "Deals & Promos",
        href: "#",
        description: "Grab limited-time seat sales and promo fares before they're gone",
        icon: BadgePercent,
      },
      {
        label: "Group Bookings",
        href: "#",
        description: "Traveling with 10 or more? Get special group rates",
        icon: Users,
      },
    ],
  },
  {
    label: "Manage",
    href: "#",
    description: "Everything you need to manage an existing booking.",
    children: [
      {
        label: "My Trips",
        href: "#",
        description: "View, change, or cancel your upcoming bookings",
        icon: Ticket,
      },
      {
        label: "Web Check-in",
        href: "#",
        description: "Check in online and skip the counter queue",
        icon: CalendarClock,
      },
      {
        label: "Flight Status",
        href: "#",
        description: "Track real-time departure and arrival updates",
        icon: PlaneTakeoff,
      },
    ],
  },
  {
    label: "Travel Info",
    href: "#",
    description: "Good to know before you fly with us.",
    children: [
      {
        label: "Baggage Policy",
        href: "#",
        description: "Carry-on and checked baggage allowances and fees",
        icon: Luggage,
      },
      {
        label: "Visa & Passport",
        href: "#",
        description: "Entry requirements for your destination country",
        icon: ShieldCheck,
      },
      {
        label: "Travel Advisories",
        href: "#",
        description: "Stay updated on weather delays and travel alerts",
        icon: Globe2,
      },
    ],
  },
  {
    label: "Explore",
    href: "#",
    description: "Get inspired for your next getaway.",
    children: [
      {
        label: "Destinations",
        href: "#",
        description: "Discover places to visit on our route map",
        icon: MapPinned,
      },
      {
        label: "Travel Guides",
        href: "#",
        description: "Tips and itineraries curated by local experts",
        icon: Compass,
      },
      {
        label: "Seat Sale Calendar",
        href: "#",
        description: "See upcoming sale dates so you never miss a deal",
        icon: BadgePercent,
      },
    ],
  },
  {
    label: "About",
    href: "#",
    description: "Learn more about who we are and where we're headed.",
    children: [
      {
        label: "Our Story",
        href: "#",
        description: "How we started and what drives us forward",
        icon: Landmark,
      },
      {
        label: "Newsroom",
        href: "#",
        description: "Announcements, press releases, and company news",
        icon: Newspaper,
      },
      {
        label: "Careers",
        href: "#",
        description: "Join our growing team across the region",
        icon: Building2,
      },
    ],
  },
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
