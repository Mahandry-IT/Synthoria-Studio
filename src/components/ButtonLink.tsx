"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { buttonBaseClassName, type ButtonVariant } from "@/components/Button";
import { cx } from "@/shared/utils/cx";

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: "md" | "sm";
};

/** Lien de navigation (`next/link`) qui a l'apparence d'un `Button` : cible de 44 px par défaut. */
export function ButtonLink({ variant = "primary", size = "md", className, ...props }: ButtonLinkProps) {
  return (
    <Link
      className={cx(buttonBaseClassName(variant, size), className)}
      {...props}
    />
  );
}
