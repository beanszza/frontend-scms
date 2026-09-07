"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { HeaderNotifications } from "./HeaderNotifications";
import { navItems } from "./SidebarNav";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function getBreadcrumbItems(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return [
      { label: "SCMS", href: "/" },
      { label: "Dashboard", isCurrent: true },
    ];
  }

  const items: Array<{ label: string; href?: string; isCurrent?: boolean }> = [
    { label: "SCMS", href: "/" },
  ];

  if (segments[0] === "dashboard") {
    if (segments.length === 1) {
      items.push({ label: "Dashboard", isCurrent: true });
    } else {
      items.push({ label: "Dashboard", href: "/dashboard" });
      items.push({ label: "Detail", isCurrent: true });
    }
  } else {
    const navItem = navItems.find((item) => item.href === `/${segments[0]}`);
    const pageName = navItem
      ? navItem.name
      : segments[0]
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
    items.push({ label: pageName, isCurrent: true });
  }

  return items;
}

export function Header() {
  const rawPathname = usePathname();
  const pathname = rawPathname || "/";
  const breadcrumbItems = getBreadcrumbItems(pathname);

  return (
    <header className="sticky top-0 z-50 flex justify-between items-center w-full px-4 sm:px-6 h-14 bg-background border-b border-border">
      {/* Left: Sidebar Toggle & Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 overflow-hidden">
        <SidebarTrigger className="h-8 w-8 shrink-0 hover:bg-accent text-foreground transition-all cursor-pointer rounded-md" />
        <Separator orientation="vertical" className="h-4" />
        <Breadcrumb className="overflow-hidden">
          <BreadcrumbList className="flex-nowrap whitespace-nowrap text-sm font-medium">
            {breadcrumbItems.map((item, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <BreadcrumbSeparator className="text-muted-foreground [&>svg]:w-3.5 [&>svg]:h-3.5" />
                )}
                <BreadcrumbItem>
                  {item.isCurrent ? (
                    <BreadcrumbPage className="font-semibold text-foreground text-sm">
                      {item.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      asChild
                      className="text-muted-foreground hover:text-foreground font-medium text-sm"
                    >
                      <Link href={item.href || "#"}>{item.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Right: Notifications & Help */}
      <div className="flex items-center gap-1 shrink-0">
        <HeaderNotifications />
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground w-8 h-8 rounded-md"
              >
                <HelpCircle className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Help & documentation</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  );
}
