export type Role = "admin" | "veterinario" | "recepcion";

export interface SessionUser {
  id: string;
  name: string;
  jobTitle: string;
  role: Role;
  avatarUrl?: string;
}
