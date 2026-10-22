import { cn } from "~/core/lib/cn";
import { SmartImage } from "./SmartImage";

const SIZES = { sm: "size-8 text-xs", md: "size-11 text-sm", lg: "size-14 text-base" } as const;
const SHAPES = { circle: "rounded-full", rounded: "rounded-xl" } as const;

interface AvatarProps {
  name: string;
  src?: string;
  size?: keyof typeof SIZES;
  shape?: keyof typeof SHAPES;
  className?: string;
}

export function Avatar({ name, src, size = "md", shape = "circle", className }: AvatarProps) {
  const initial = (
    <span aria-hidden className="font-bold">
      {name.charAt(0).toUpperCase()}
    </span>
  );

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden bg-brand-soft text-brand-text",
        SIZES[size],
        SHAPES[shape],
        className,
      )}
    >
      {src ? (
        <SmartImage src={src} alt="" className="size-full object-cover" fallback={initial} />
      ) : (
        initial
      )}
    </span>
  );
}
