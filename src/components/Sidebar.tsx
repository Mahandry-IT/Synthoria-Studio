"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import QuizIcon from "@mui/icons-material/Quiz";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: "Upload", href: "/", icon: <CloudUploadIcon /> },
  { label: "Question", href: "/ask", icon: <QuizIcon /> },
];

/**
 * Sidebar verticale de navigation avec icônes MUI.
 * Affiche les liens principaux de l'application.
 */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-gray-200 bg-white">
      {/* Brand */}
      <div className="flex h-14 items-center border-b border-gray-200 px-5">
        <span className="text-lg font-bold text-gray-900">Synthoria</span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Navigation principale">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <span className={isActive ? "text-indigo-600" : "text-gray-400"}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4">
        <p className="text-xs text-gray-400">Synthoria Studio</p>
      </div>
    </aside>
  );
}
