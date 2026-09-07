import {
  LayoutDashboard,
  Warehouse,
  ShoppingCart,
  Boxes,
  Building2,
  Truck,
  Settings,
  Users2,
  CreditCard,
  PackageCheck,
  GitBranch,
  ClipboardList,
  BarChart3,
  Calculator,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  group?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export interface SystemItem {
  fullName: string;
  desc: string;
  icon: LucideIcon;
  active: boolean;
}

export interface AccountItem {
  id: string;
  name: string;
  role: string;
  email: string;
}

export type Account = AccountItem;

export const navGroups: NavGroup[] = [
  {
    label: "Core",
    items: [
      { name: "Dashboard",            href: "/",                    icon: LayoutDashboard },
      { name: "Resources & Suppliers", href: "/resources-suppliers", icon: Warehouse },
      { name: "Orders & Procurement", href: "/orders-procurement",  icon: ShoppingCart },
    ],
  },
  {
    label: "Operations",
    items: [
      { name: "Goods Receiving",      href: "/goods-receiving",     icon: PackageCheck },
      { name: "Inventory",            href: "/inventory",           icon: Boxes },
      { name: "Production & Quality", href: "/production-quality",  icon: Building2 },
      { name: "Distribution",         href: "/distribution",        icon: Truck },
    ],
  },
  {
    label: "Analytics",
    items: [
      { name: "Traceability",         href: "/traceability",        icon: GitBranch },
      { name: "Cycle Counts",         href: "/cycle-counts",        icon: ClipboardList },
      { name: "Valuation",            href: "/valuation",           icon: BarChart3 },
      { name: "MRP Planning",         href: "/mrp",                 icon: Calculator },
    ],
  },
];

/** Flat list of all nav items for breadcrumb lookups */
export const mainNavItems: NavItem[] = navGroups.flatMap((g) => g.items);

export const settingsNavItem: NavItem = {
  name: "Settings",
  href: "/settings",
  icon: Settings,
};

export const navItems: NavItem[] = [...mainNavItems, settingsNavItem];

export const systems: SystemItem[] = [
  {
    fullName: "Customer Relationship Management",
    desc: "Customer profiles, tickets & marketing",
    icon: Building2,
    active: false,
  },
  {
    fullName: "E-Commerce Storefront",
    desc: "Online orders & products",
    icon: ShoppingCart,
    active: false,
  },
  {
    fullName: "Human Resource Management",
    desc: "Staff directory & payroll",
    icon: Users2,
    active: false,
  },
  {
    fullName: "Point of Sale",
    desc: "Retail & register checkout",
    icon: CreditCard,
    active: false,
  },
  {
    fullName: "Supply Chain Management",
    desc: "Inventory & logistics",
    icon: Truck,
    active: true,
  },
];

export const accounts: AccountItem[] = [
  {
    id: "admin",
    name: "Bren Raphael",
    role: "Administrator",
    email: "bren@sentracx.com",
  },
  {
    id: "support",
    name: "Support Lead Account",
    role: "Support Manager",
    email: "support.lead@sentracx.com",
  },
  {
    id: "sales",
    name: "Sales Ops Account",
    role: "Sales Lead",
    email: "sales.ops@sentracx.com",
  },
];
