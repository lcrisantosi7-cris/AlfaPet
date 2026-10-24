import { Moon, Sun } from "lucide-react";
import { useFetcher } from "react-router";
import { THEME_FETCHER_KEY } from "~/core/theme/theme";
import { useTheme } from "~/core/theme/use-theme";

export function ThemeToggle() {
  const fetcher = useFetcher({ key: THEME_FETCHER_KEY });
  const theme = useTheme();
  const next = theme === "dark" ? "light" : "dark";

  return (
    <fetcher.Form method="post" action="/theme">
      <input type="hidden" name="theme" value={next} />
      <button
        type="submit"
        aria-label={next === "dark" ? "Activar modo oscuro" : "Activar modo claro"}
        className="ui-icon-button flex size-11 items-center justify-center rounded-full border border-line bg-surface text-ink-muted hover:border-brand/50 hover:text-brand-text"
      >
        {theme === "dark" ? <Sun className="size-5" aria-hidden /> : <Moon className="size-5" aria-hidden />}
      </button>
    </fetcher.Form>
  );
}
