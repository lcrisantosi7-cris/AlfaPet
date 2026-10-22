import { data, type LoaderFunctionArgs } from "react-router";
import { findNavItem } from "~/core/config/navigation";

export async function placeholderLoader({ request }: LoaderFunctionArgs) {
  const item = findNavItem(new URL(request.url).pathname);
  if (!item) throw data("Módulo no encontrado", { status: 404 });
  return { key: item.key, label: item.label, icon: item.icon };
}
