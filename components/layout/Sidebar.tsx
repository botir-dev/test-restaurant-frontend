"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { authApi, customRoleApi, restaurantApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { ROLE_LABELS } from "@/lib/utils";
import toast from "react-hot-toast";
import Image from "next/image";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Table2,
  ShoppingBag,
  Package,
  Users,
  QrCode,
  LogOut,
  ChefHat,
  CreditCard,
  X,
  Menu,
  ChevronRight,
  Building2,
  Archive,
  Settings,
  Wallet,
  FileText,
  Warehouse,
  BookOpen,
} from "lucide-react";
import { useState } from "react";
import clsx from "clsx";
import WebSocketProvider from "@/components/providers/WebSocketProvider";

const navItems = [
  {
    href: "/dashboard",
    label: "Bosh sahifa",
    icon: LayoutDashboard,
    roles: ["manager", "super_admin"],
  },
  {
    href: "/tables",
    label: "Stollar",
    icon: Table2,
    roles: ["waiter", "manager"],
  },
  {
    href: "/orders",
    label: "Buyurtmalar",
    icon: ShoppingBag,
    roles: ["waiter", "manager", "cashier"],
  },
  {
    href: "/kitchen",
    label: "Oshxona paneli",
    icon: ChefHat,
    roles: [
      "cook",
      "baker",
      "somsa_maker",
      "grill_master",
      "turkish_cook",
      "bartender",
      "icecream_maker",
      "tea_master",
    ],
  },
  {
    href: "/cashier",
    label: "Kassa",
    icon: CreditCard,
    roles: ["cashier", "manager"],
  },
  {
    href: "/inventory",
    label: "Omborxona",
    icon: Warehouse,
    roles: ["manager", "storekeeper"],
  },
  {
    href: "/menumanage",
    label: "Menyu",
    icon: BookOpen,
    roles: [
      "manager",
      "storekeeper",
      "cook",
      "baker",
      "somsa_maker",
      "grill_master",
      "turkish_cook",
      "bartender",
      "icecream_maker",
      "tea_master",
    ],
  },
  { href: "/staff", label: "Xodimlar", icon: Users, roles: ["manager"] },
  { href: "/qr", label: "QR Kodlar", icon: QrCode, roles: ["manager"] },
  { href: "/archive", label: "Arxiv", icon: Archive, roles: ["manager"] },
  { href: "/reports", label: "Hisobotlar", icon: FileText, roles: ["manager"] },
  {
    href: "/admin",
    label: "Boshqaruv",
    icon: Building2,
    roles: ["super_admin"],
  },
  {
    href: "/settings",
    label: "Sozlamalar",
    icon: Settings,
    roles: ["manager"],
  },
  {
    href: "/earnings",
    label: "Mening maoshim",
    icon: Wallet,
    roles: [
      "waiter",
      "cashier",
      "storekeeper",
      "cook",
      "baker",
      "somsa_maker",
      "grill_master",
      "turkish_cook",
      "bartender",
      "icecream_maker",
      "tea_master",
    ],
  },
];

const STANDARD_ROLES = [
  "manager",
  "super_admin",
  "waiter",
  "cashier",
  "storekeeper",
  "cook",
  "baker",
  "somsa_maker",
  "grill_master",
  "turkish_cook",
  "bartender",
  "icecream_maker",
  "tea_master",
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);

  // Restoran ma'lumotini olish
  const { data: restaurantData } = useQuery({
    queryKey: ["restaurant-me"],
    queryFn: () => restaurantApi.getMe().then((r) => r.data?.data),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const restaurantName = restaurantData?.name || "Restoran";
  const logoUrl = restaurantData?.logo_url;

  const handleLogout = async () => {
    try {
      const rt = localStorage.getItem("refresh_token");
      if (rt) await authApi.logout(rt);
    } catch {}
    logout();
    router.replace("/login");
    toast.success("Chiqildi");
  };

  const { data: customRolesData } = useQuery({
    queryKey: ["custom-roles"],
    queryFn: () => customRoleApi.getAll(),
    enabled: !!user && user.role === "manager",
    staleTime: 60000,
  });

  const isCustomRole = user ? !STANDARD_ROLES.includes(user.role) : false;

  const visible = navItems.filter((n) => {
    if (!user) return false;
    if (n.roles.includes(user.role)) return true;
    if (
      isCustomRole &&
      (n.href === "/kitchen" ||
        n.href === "/menumanage" ||
        n.href === "/earnings")
    )
      return true;
    return false;
  });

  // Logo komponenti
  const LogoIcon = ({ size = "md" }: { size?: "sm" | "md" }) => {
    const cls = size === "sm" ? "w-7 h-7 rounded-lg" : "w-9 h-9 rounded-xl";

    if (logoUrl) {
      return (
        <div className={`${cls} overflow-hidden flex-shrink-0 bg-gray-100`}>
          <Image
            src={logoUrl}
            alt={restaurantName}
            width={size === "sm" ? 28 : 36}
            height={size === "sm" ? 28 : 36}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Xato bo'lsa fallback icon
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      );
    }

    return (
      <div
        className={`${cls} bg-green-600 flex items-center justify-center flex-shrink-0`}
      >
        <UtensilsCrossed
          className={
            size === "sm" ? "w-4 h-4 text-white" : "w-5 h-5 text-white"
          }
        />
      </div>
    );
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
        <LogoIcon size="md" />
        <div className="min-w-0">
          <div className="flex gap-2 items-center">
            <p className="font-bold text-gray-900 text-sm truncate">
              {restaurantName} Tizimi
            </p>
            <span className="text-white bg-[#CCA121] px-2 py- flex items-center justify-center font-serif w-fit text-[12px] rounded-[4px]">
              {" "}
              Beta{" "}
            </span>
          </div>

          <p className="text-xs text-gray-500 truncate">{user?.full_name}</p>
        </div>
      </div>

      <div className="px-4 py-3">
        <span className="badge bg-green-100 text-green-700">
          {user ? ROLE_LABELS[user.role] || user.role : ""}
        </span>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {visible.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150",
                active
                  ? "bg-green-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3 h-3 opacity-70" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Chiqish
        </button>
      </div>
    </div>
  );

  return (
    <>
      <WebSocketProvider />

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LogoIcon size="sm" />
          <span className="font-bold text-gray-900 text-sm">
            {restaurantName}
          </span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <Menu className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-64 bg-white h-full shadow-2xl animate-slideUp">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
            <NavContent />
          </div>
        </div>
      )}

      <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-gray-100 fixed h-full z-30">
        <NavContent />
      </aside>
    </>
  );
}
