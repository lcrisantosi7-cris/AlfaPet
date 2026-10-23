import {
  CalendarDays,
  ClipboardList,
  Home,
  Package,
  PawPrint,
  Settings,
  UsersRound,
  Stethoscope,
  Syringe,
  ChartColumn,
  type LucideIcon,
} from "lucide-react";
import type { NavIconName } from "~/core/config/navigation";

export const NAV_ICONS: Record<NavIconName, LucideIcon> = {
  home: Home,
  patients: PawPrint,
  appointments: CalendarDays,
  consultations: Stethoscope,
  history: ClipboardList,
  vaccines: Syringe,
  products: Package,
  reports: ChartColumn,
  settings: Settings,
  users: UsersRound,
};
