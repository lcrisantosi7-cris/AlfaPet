export type Role = "admin" | "veterinario" | "recepcion";

export interface SessionUser {
  id: string;
  name: string;
  jobTitle: string;
  role: Role;
  avatarUrl?: string;
}

export interface UserProfile extends SessionUser {
  isActive: boolean;
}

export type SessionState =
  | { kind: "anonymous" }
  | { kind: "inactive" }
  | { kind: "active"; user: SessionUser };