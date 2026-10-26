import { ConfirmForm } from "~/core/feedback/ConfirmForm";
import type { NavIconName } from "~/core/config/navigation";
import { ModulePlaceholder } from "./ModulePlaceholder";
import { placeholderLoader } from "./placeholder.controller.server";

type PlaceholderData = { key: string; label: string; icon: NavIconName };

export const loader = placeholderLoader;

export const meta = ({ loaderData }: { loaderData?: PlaceholderData | null }) => [
  { title: `${loaderData?.label ?? "Módulo"} | Alfapet Veterinaria` },
];

export default function PlaceholderRoute({ loaderData }: { loaderData: PlaceholderData }) {
  return <ModulePlaceholder label={loaderData.label} icon={loaderData.icon} />;
}
