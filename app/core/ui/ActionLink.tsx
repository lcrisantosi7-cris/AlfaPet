import { ArrowRight } from "lucide-react";
import { Link, type LinkProps } from "react-router";

export function ActionLink({ children, ...props }: LinkProps) {
  return (
    <Link
      className="ui-text-link inline-flex items-center gap-1 text-sm font-semibold text-brand-text hover:underline"
      {...props}
    >
      {children}
      <ArrowRight className="size-4" aria-hidden />
    </Link>
  );
}
