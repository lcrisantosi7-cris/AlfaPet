import type { Route } from "./+types/placeholder.route";
import { ConfirmForm } from "~/core/feedback/ConfirmForm";
import { ModulePlaceholder } from "./ModulePlaceholder";
import { placeholderLoader } from "./placeholder.controller.server";

export const loader = placeholderLoader;

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: `${loaderData?.label ?? "Módulo"} | Alfapet Veterinaria` },
];

export default function PlaceholderRoute({ loaderData }: Route.ComponentProps) {
  return <ModulePlaceholder label={loaderData.label} icon={loaderData.icon} />;
}
