import type { ReactNode } from "react";
import { cn } from "~/core/lib/cn";

const VARIANTS = {
  success: "bg-tone-green-icon text-tone-green-fg",
  info: "bg-tone-blue-icon text-tone-blue-fg",
} as const;

interface BadgeProps {
  variant: keyof typeof VARIANTS;
  children: ReactNode;
}

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", VARIANTS[variant])}>
      {children}
    </span>
  );
}
