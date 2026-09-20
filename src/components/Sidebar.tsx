"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DashboardIcon from "@mui/icons-material/Dashboard";
import QuizIcon from "@mui/icons-material/Quiz";
import HistoryIcon from "@mui/icons-material/History";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import MenuIcon from "@mui/icons-material/Menu";
import { SidebarNavItem } from "@/components/sidebar/SidebarNavItem";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <DashboardIcon /> },
  { label: "Upload", href: "/", icon: <CloudUploadIcon /> },
  { label: "Question", href: "/ask", icon: <QuizIcon /> },
  { label: "History", href: "/history", icon: <HistoryIcon /> },
];

/**
 * Sidebar verticale flottante (carte arrondie) avec icônes MUI.
 * Écran ≥ md : toujours visible, réductible en mode icônes seules via le bouton en pied de carte.
 * Petit écran : masquée, un bouton carré (3 lignes) l'affiche en tiroir par-dessus la page.
 */
export function Sidebar() {
  const pathname = usePathname();
  const [collapsedPref, setCollapsedPref] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  // Le mode réduit n'existe que sur grand écran : le tiroir mobile est toujours déplié
  const collapsed = collapsedPref && isDesktop;
  const closeMobile = () => setMobileOpen(false);

  // Échap referme le tiroir mobile
  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  return (
    <>
      {/* Bouton d'ouverture (petit écran) */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Ouvrir le menu"
        aria-expanded={mobileOpen}
        aria-controls="sidebar"
        className="fixed left-3 top-3 z-30 flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 md:hidden"
      >
        <MenuIcon />
      </button>

      {/* Voile derrière le tiroir (petit écran) */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm md:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      <aside
        id="sidebar"
        className={`fixed left-0 top-0 z-50 m-3 flex h-[calc(100vh-1.5rem)] shrink-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-[width,transform] duration-200 md:static md:z-auto md:translate-x-0 ${
          collapsed ? "w-18" : "w-60"
        } ${mobileOpen ? "translate-x-0" : "max-md:invisible max-md:-translate-x-[110%]"}`}
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
          {!collapsed && (
            <span className="text-lg font-bold text-gray-900">Synthoria</span>
          )}
          <button
            type="button"
            onClick={closeMobile}
            aria-label="Fermer le menu"
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 md:hidden"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Navigation */}
        <nav
          className="flex flex-1 flex-col gap-1 p-3"
          aria-label="Navigation principale"
        >
          {navItems.map((item) => (
            <SidebarNavItem
              key={item.href}
              label={item.label}
              href={item.href}
              icon={item.icon}
              isActive={pathname === item.href}
              collapsed={collapsed}
              onNavigate={closeMobile}
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
              <p className="truncate text-sm font-semibold text-gray-900">
                Synthoria Studio
              </p>
              <p className="truncate text-xs text-gray-500">Cours par IA</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => setCollapsedPref((c) => !c)}
            aria-label={
              collapsed
                ? "Déplier la barre latérale"
                : "Réduire la barre latérale"
            }
            aria-expanded={!collapsed}
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors md:flex hover:bg-white hover:text-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </button>
        </div>
      </aside>
    </>
  );
}
