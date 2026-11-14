interface PlanIconButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: string;
}

/** Bouton textuel (↑ ↓ ＋ ✕) des actions d'une section du plan : cible de 44 × 44 px. */
export function PlanIconButton({ label, onClick, disabled, children }: PlanIconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-11 w-11 items-center justify-center rounded-ctrl text-base text-ink-2 transition-colors hover:bg-sunken disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent motion-reduce:transition-none"
    >
      {children}
    </button>
  );
}
