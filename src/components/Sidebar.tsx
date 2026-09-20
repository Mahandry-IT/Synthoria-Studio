"use client";

import { useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import QuizIcon from "@mui/icons-material/Quiz";
import HistoryIcon from "@mui/icons-material/History";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { SidebarNavItem } from "@/components/sidebar/SidebarNavItem";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: "Upload", href: "/", icon: <CloudUploadIcon /> },
  { label: "Question", href: "/ask", icon: <QuizIcon /> },
  { label: "History", href: "/history", icon: <HistoryIcon /> },
];

/**
 * Sidebar verticale flottante (carte arrondie) avec icônes MUI.
 * Peut être réduite en mode icônes seules via le bouton en pied de carte.
 */
export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`m-3 flex h-[calc(100vh-1.5rem)] shrink-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-[width] duration-200 ${
        collapsed ? "w-18" : "w-60"
      }`}
    >
      {/* Brand */}
      <div
        className={`flex h-16 items-center border-b border-gray-100 ${
          collapsed ? "justify-center" : "gap-3 px-4"
        }`}
      >
        <Image
          src="/logo-mark.svg"
          alt={collapsed ? "Synthoria" : ""}
          width={36}
          height={36}
          unoptimized
          priority
          className="h-9 w-9 shrink-0"
        />
        {!collapsed && <span className="text-lg font-bold text-gray-900">Synthoria</span>}
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Navigation principale">
        {navItems.map((item) => (
          <SidebarNavItem
            key={item.href}
            label={item.label}
            href={item.href}
            icon={item.icon}
            isActive={pathname === item.href}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* Footer */}
      <div
        className={`flex items-center border-t border-gray-100 bg-indigo-50/60 p-3 ${
          collapsed ? "justify-center" : "justify-between gap-2"
        }`}
      >
        {!collapsed && (
          <div className="min-w-0 pl-1">
            <p className="truncate text-sm font-semibold text-gray-900">Synthoria Studio</p>
            <p className="truncate text-xs text-gray-500">Cours par IA</p>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Déplier la barre latérale" : "Réduire la barre latérale"}
          aria-expanded={!collapsed}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white hover:text-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </button>
      </div>
    </aside>
  );
}
