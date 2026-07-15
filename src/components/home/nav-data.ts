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
