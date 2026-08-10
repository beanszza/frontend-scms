"use client";

import React from "react";
import Link from "next/link";
import { MoreVertical, Check, User, Shield, Activity, LogOut, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Account, accounts } from "./SidebarNav";

interface SidebarProfileFooterProps {
  activeAccount: string;
  onSelectAccount: (id: string) => void;
}

export function SidebarProfileFooter({ activeAccount, onSelectAccount }: SidebarProfileFooterProps) {
  const currentAccount: Account = accounts.find((a) => a.id === activeAccount) || accounts[0];

  return (
    <div className="w-full">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-sidebar-accent transition-colors cursor-pointer group">
            <div className="relative shrink-0">
              <Avatar className="w-11 h-11 border-2 border-border shadow-sm">
                <AvatarFallback className="text-sm bg-primary text-primary-foreground font-bold">
                  BR
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-sidebar" title="Online" />
            </div>
            <div className="flex-1 overflow-hidden space-y-0.5">
              <p className="text-sm font-bold truncate text-sidebar-foreground leading-tight">{currentAccount.name}</p>
              <p className="text-xs font-medium text-muted-foreground truncate leading-tight">{currentAccount.role}</p>
            </div>
            <MoreVertical className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-sidebar-foreground transition-colors" />
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-64 bg-popover border-border text-popover-foreground z-[999] shadow-xl p-2" side="top" align="start">
          <div className="p-3 bg-muted/40 rounded-lg border border-border mb-2 flex items-center gap-3">
            <Avatar className="w-10 h-10 border border-border shrink-0">
              <AvatarFallback className="text-xs bg-primary text-primary-foreground font-bold">BR</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 overflow-hidden">
              <span className="text-xs font-bold text-foreground truncate">{currentAccount.name}</span>
              <span className="text-[11px] text-muted-foreground truncate">{currentAccount.email}</span>
              <Badge variant="outline" className="text-[9px] w-fit mt-1 px-1.5 py-0 font-semibold">
                {currentAccount.role}
              </Badge>
            </div>
          </div>

          <DropdownMenuLabel className="text-[11px] text-muted-foreground font-semibold px-2 py-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Switch Role / Account
          </DropdownMenuLabel>
          <div className="space-y-0.5 mb-2">
            {accounts.map((acc) => (
              <DropdownMenuItem
                key={acc.id}
                onClick={() => {
                  onSelectAccount(acc.id);
                  toast.success(`Switched role to ${acc.name} (${acc.role})`);
                }}
                className={`cursor-pointer text-xs flex items-center justify-between p-2 rounded-md transition-colors ${
                  activeAccount === acc.id ? "bg-accent font-bold text-foreground" : "hover:bg-accent/60"
                }`}
              >
                <div className="flex flex-col overflow-hidden">
                  <span className="truncate">{acc.name}</span>
                  <span className="text-[10px] text-muted-foreground">{acc.role}</span>
                </div>
                {activeAccount === acc.id && <Check className="w-4 h-4 text-primary shrink-0 ml-2" />}
              </DropdownMenuItem>
            ))}
          </div>

          <DropdownMenuSeparator className="bg-border" />

          <DropdownMenuItem asChild className="cursor-pointer text-xs font-medium gap-2 p-2 hover:bg-accent">
            <Link href="/settings">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Profile Settings</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer text-xs font-medium gap-2 p-2 hover:bg-accent">
            <Shield className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Security Options</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer text-xs font-medium gap-2 p-2 hover:bg-accent">
            <Activity className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Activity Logs</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-border" />

          <DropdownMenuItem
            onClick={() => toast.info("Sign out triggered")}
            className="cursor-pointer text-xs font-medium gap-2 p-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
