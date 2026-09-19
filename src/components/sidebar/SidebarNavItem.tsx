import Link from "next/link";

interface SidebarNavItemProps {
  label: string;
  href: string;
  icon: React.ReactNode;
  isActive: boolean;
  collapsed: boolean;
}

/**
 * Lien de navigation de la sidebar.
 * En mode réduit, seule l'icône est visible (le libellé reste accessible via aria-label / title).
 */
export function SidebarNavItem({ label, href, icon, isActive, collapsed }: SidebarNavItemProps) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      aria-current={isActive ? "page" : undefined}
      className={`flex items-center rounded-xl py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
        collapsed ? "justify-center px-0" : "gap-3 px-3"
      } ${
        isActive
          ? "bg-indigo-50 text-indigo-700"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <span className={`flex shrink-0 ${isActive ? "text-indigo-600" : "text-gray-400"}`}>
        {icon}
      </span>
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}
