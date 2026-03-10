
"use client";

import { LayoutDashboard, Settings, History, Calendar, Mail, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store";
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
import { useRouter } from "next/navigation";
import { logoutUser } from "@/actions/auth";

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { title: "Configuration", icon: Settings, href: "/config" },
    { title: "Activity History", icon: History, href: "/history" },
  ];

  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  const handleSignOut = async () => {
    await logoutUser();
    router.push("/login");
  };

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
        <div className="flex flex-col gap-4">
          <div className="bg-white/10 rounded-lg p-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-medium text-white/80">Watcher Active</span>
          </div>
          <button
            onClick={() => handleSignOut()}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-300 hover:bg-white/10 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
