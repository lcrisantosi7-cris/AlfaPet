const isProd = import.meta.env.PROD;

const SUPABASE = "https://*.supabase.co";

// CSP solo en producción: en desarrollo Vite necesita scripts inline para HMR.
// TODO: reemplazar 'unsafe-inline' por nonce cuando se agregue autenticación.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  `img-src 'self' data: blob: ${SUPABASE}`,
  `connect-src 'self' ${SUPABASE} wss://*.supabase.co`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

export function securityHeaders(): Record<string, string> {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    ...(isProd && {
      "Content-Security-Policy": CSP,
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    }),
  };
}
