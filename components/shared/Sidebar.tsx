"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsUpDown, Check, X } from "lucide-react";
import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { mainNavItems, settingsNavItem, systems } from "./SidebarNav";
import { SidebarProfileFooter } from "./SidebarProfileFooter";

export function Sidebar() {
  const pathname = usePathname();
  const { open, openMobile, setOpenMobile, toggleSidebar, isMobile } =
    useSidebar();
  const [activeAccount, setActiveAccountState] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("activeAccount") || "admin";
    }
    return "admin";
  });
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
    // Initialize in localStorage if not set
    if (localStorage.getItem("activeAccount") === null) {
      localStorage.setItem("activeAccount", "admin");
    }
  }, []);

  const setActiveAccount = (id: string) => {
    setActiveAccountState(id);
    localStorage.setItem("activeAccount", id);
    window.dispatchEvent(new Event("storage"));
  };


  const isOpen = isMobile ? openMobile : open;

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  // During SSR and initial hydration, render the sidebar so the server and
  // client trees match. After mounting, respect the open/mobile state.
  if (mounted && !isOpen) {
    return null;
  }

  const SettingsIcon = settingsNavItem.icon;
  const isSettingsActive = pathname === settingsNavItem.href;

  return (
    <>
      {isMobile && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[90] animate-in fade-in duration-200"
        />
      )}
      <aside className="fixed left-0 top-0 h-full w-64 flex flex-col border-r border-border bg-sidebar text-sidebar-foreground z-[100] transition-all duration-300 shadow-xl md:shadow-none animate-in slide-in-from-left duration-300">
        <SidebarHeader className="px-4 py-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center justify-between px-2 py-1.5 -mx-2 rounded-lg hover:bg-sidebar-accent cursor-pointer transition-colors group">
                    <div className="flex flex-col min-w-0 gap-0.5">
                      <h1 className="text-lg font-extrabold tracking-tight text-sidebar-foreground truncate leading-tight">
                        Bren Raphael&apos;s
                      </h1>
                      <span className="text-[11px] font-semibold bg-violet-500 text-white px-2 py-0.5 rounded w-fit leading-tight">
                        Supply Chain Mgmt.
                      </span>
                    </div>
                    <ChevronsUpDown className="w-4 h-4 text-muted-foreground shrink-0 ml-2 group-hover:text-sidebar-foreground transition-colors" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-64 bg-popover border-border text-popover-foreground z-[150]"
                  align="start"
                  side="bottom"
                  sideOffset={8}
                >
                  <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold px-3 py-2">
                    Select Enterprise Module
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border" />
                  {systems.map((sys) => {
                    const SysIcon = sys.icon;
                    return (
                      <DropdownMenuItem
                        key={sys.fullName}
                        className="cursor-pointer flex items-center justify-between px-3 py-2.5 hover:bg-accent"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <SysIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div className="flex flex-col overflow-hidden">
                            <span
                              className={`text-sm font-medium truncate ${sys.active ? "text-foreground font-semibold" : ""}`}
                            >
                              {sys.fullName}
                            </span>
                            <span className="text-[11px] text-muted-foreground truncate">
                              {sys.desc}
                            </span>
                          </div>
                        </div>
                        {sys.active && (
                          <Check className="w-4 h-4 text-primary shrink-0 ml-2" />
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {isMobile && (
              <SidebarTrigger
                className="text-muted-foreground hover:text-sidebar-foreground h-8 w-8 rounded-lg shrink-0 cursor-pointer"
                title="Close Sidebar"
              >
                <X className="w-5 h-5" />
              </SidebarTrigger>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent className="px-3 py-4 overflow-y-auto">
          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5">
                {mainNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
                      >
                        <Link href={item.href} onClick={handleNavClick}>
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="px-3 py-3 border-t border-border space-y-2">
          <SidebarMenu>
            <SidebarMenuItem key={settingsNavItem.name}>
              <SidebarMenuButton
                asChild
                isActive={isSettingsActive}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
              >
                <Link href={settingsNavItem.href} onClick={handleNavClick}>
                  <SettingsIcon className="w-4 h-4 shrink-0" />
                  <span>{settingsNavItem.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          <div className="pt-2 border-t border-border">
            <SidebarProfileFooter
              activeAccount={activeAccount}
              onSelectAccount={setActiveAccount}
            />
          </div>
        </SidebarFooter>

        <SidebarRail />
      </aside>
    </>
  );
}
