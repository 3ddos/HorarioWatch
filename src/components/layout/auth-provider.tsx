"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { Loader2 } from "lucide-react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, authLoaded } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!authLoaded) return;

    const isAuthRoute = pathname === "/login" || pathname === "/register";

    if (!user && !isAuthRoute) {
      router.push("/login");
    } else if (user && isAuthRoute) {
      router.push("/");
    }
  }, [user, authLoaded, pathname, router]);

  if (!authLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not logged in and not on auth route, don't render children to prevent flash
  if (!user && pathname !== "/login" && pathname !== "/register") {
    return null;
  }

  return <>{children}</>;
}
