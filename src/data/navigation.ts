export interface NavLink {
  href: string;
  label: string;
}

export const mainNav: NavLink[] = [
  { href: "/services", label: "Services" },
  { href: "/work", label: "Work" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
];

export const footerNav: {
  title: string;
  links: NavLink[];
}[] = [
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/services", label: "Services" },
      { href: "/work", label: "Work" },
      { href: "/pricing", label: "Pricing" },
      { href: "/contact", label: "Contact" },
      { href: "/blog", label: "Blog" },
    ],
  },
  {
    title: "Platform",
    links: [
      { href: "/console/login", label: "Client Portal" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms of Service" },
      { href: "/appropriate-use", label: "Appropriate Use" },
      { href: "/privacy", label: "Privacy Policy" },
    ],
  },
];
