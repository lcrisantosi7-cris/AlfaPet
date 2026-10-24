import { Moon, Sun } from "lucide-react";
import { useFetcher } from "react-router";
import { cn } from "~/core/lib/cn";
import { THEME_FETCHER_KEY } from "~/core/theme/theme";
import { useTheme } from "~/core/theme/use-theme";

export function ThemeToggle() {
  const fetcher = useFetcher({ key: THEME_FETCHER_KEY });
  const theme = useTheme();
  const dark = theme === "dark";
  const next = dark ? "light" : "dark";

  return (
    <fetcher.Form method="post" action="/theme">
      <input type="hidden" name="theme" value={next} />
      <button
        type="submit"
        aria-label={dark ? "Activar modo claro" : "Activar modo oscuro"}
        className="ui-icon-button flex size-11 items-center justify-center rounded-full border border-line bg-surface text-ink-muted hover:border-brand/50 hover:text-brand-text"
      >
        <span className="relative block size-5" aria-hidden>
          <Sun className={cn("absolute inset-0 size-5 transition-all duration-300", dark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0")} />
          <Moon className={cn("absolute inset-0 size-5 transition-all duration-300", dark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100")} />
        </span>
      </button>
    </fetcher.Form>
  );
}