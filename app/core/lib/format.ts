const dateFormatter = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC", // evita diferencias servidor/cliente al hidratar
});

/** "2026-04-12" → "12/04/2026" */
export const formatDate = (iso: string) => dateFormatter.format(new Date(iso));

/** "perro" → "Perro" */
export const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);