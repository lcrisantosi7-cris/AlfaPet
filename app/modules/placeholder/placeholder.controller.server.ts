import { data, type LoaderFunctionArgs } from "react-router";
import { NotFoundError } from "~/core/errors/app-error";
import { findNavItem } from "~/core/config/navigation";
import { requireUser } from "~/modules/auth/controller/session.controller.server";

export class PlaceholderController {
  loader = async ({ request }: LoaderFunctionArgs) => {
    const item = findNavItem(new URL(request.url).pathname);
    if (!item) throw new NotFoundError("Módulo no encontrado").toResponse();

    // El rol se valida en servidor: ocultar el menú no basta.
    const { headers } = await requireUser(request, item.roles);
    return data({ key: item.key, label: item.label, icon: item.icon }, { headers });
  };
}

export const placeholderLoader = new PlaceholderController().loader;