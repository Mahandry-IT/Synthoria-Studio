interface PlanIconButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: string;
}

/** Petit bouton textuel (↑ ↓ ＋ ✕) des actions d'une section du plan. */
export function PlanIconButton({ label, onClick, disabled, children }: PlanIconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}
