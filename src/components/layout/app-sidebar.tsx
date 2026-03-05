
"use client";

import { LayoutDashboard, Settings, History, Calendar, Mail } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { title: "Dashboard", icon: LayoutDashboard, href: "/" },
    { title: "Configuration", icon: Settings, href: "/config" },
    { title: "Activity History", icon: History, href: "/history" },
  ];

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="flex items-center justify-center py-6">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-xl">
            <Calendar className="text-primary w-6 h-6" />
          </div>
          <span className="font-headline font-bold text-xl tracking-tight group-data-[collapsible=icon]:hidden">
            HorarioWatch
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/60">Management</SidebarGroupLabel>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title} isActive={pathname === item.href}>
                  <Link href={item.href} className="flex items-center gap-3 py-6">
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 group-data-[collapsible=icon]:hidden">
        <div className="bg-white/10 rounded-lg p-3 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-medium text-white/80">Watcher Active</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
