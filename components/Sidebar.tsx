"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { removeToken, getUserRole } from "@/lib/auth";
import { logout } from "@/lib/um-api";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  TableProperties,
  CalendarDays,
  UtensilsCrossed,
  CreditCard,
  Users,
  Tag,
  Receipt,
  Settings,
  BarChart3,
  LogOut,
  CircleDollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "แดชบอร์ด", icon: LayoutDashboard },
  { href: "/tables", label: "โต๊ะ", icon: TableProperties },
  { href: "/bookings", label: "จอง", icon: CalendarDays },
  { href: "/menu", label: "เมนู", icon: UtensilsCrossed },
  { href: "/creditors", label: "ลูกหนี้", icon: CircleDollarSign },
  { href: "/promotions", label: "โปรโมชั่น", icon: Tag },
  { href: "/expenses", label: "รายจ่าย", icon: Receipt },
  { href: "/reports", label: "รายงาน", icon: BarChart3 },
  { href: "/users", label: "ผู้ใช้งาน", icon: Users, roles: ["SUPER", "ADMIN"] },
  { href: "/settings", label: "ตั้งค่า", icon: Settings, roles: ["SUPER", "ADMIN"] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const role = getUserRole();
  const visibleItems = navItems.filter((item) => !item.roles || role && item.roles.includes(role));

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore
    }
    removeToken();
    router.replace("/login");
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <CreditCard className="h-6 w-6 text-primary" />
          Snooker Manager
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-2">
        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          ออกจากระบบ
        </Button>
      </div>
    </aside>
  );
}
