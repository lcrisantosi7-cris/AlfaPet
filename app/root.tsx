import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { securityHeaders } from "./core/security/headers.server";
import { useTheme } from "./core/theme/use-theme";
import { getTheme } from "./core/theme/theme.server";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
  },
];

export const headers: Route.HeadersFunction = () => securityHeaders();

export async function loader({ request }: Route.LoaderArgs) {
  return { theme: await getTheme(request) };
}

export const meta: Route.MetaFunction = () => [{ title: "Alfapet Veterinaria" }];

export function Layout({ children }: { children: React.ReactNode }) {
  const theme = useTheme();

  return (
    <html lang="es" className={theme === "dark" ? "dark" : undefined}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Algo salió mal";
  let details = "Ocurrió un error inesperado. Intenta nuevamente.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "Página no encontrada" : "Error";
    details =
      error.status === 404 ? "La página que buscas no existe." : error.statusText || details;
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-3 p-6">
      <h1 className="text-2xl font-bold">{message}</h1>
      <p className="text-ink-muted">{details}</p>
      <a href="/" className="font-semibold text-brand-text underline">
        Volver al inicio
      </a>
      {stack && (
        <pre className="w-full overflow-x-auto rounded-lg bg-surface-muted p-4 text-xs">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
