import type { SupabaseServerClient } from "~/core/supabase/client.server";
import { ProfileRepository } from "./profile.repository.server";
import type { SessionState } from "./user.types";

export class AuthService {
    private readonly profiles: ProfileRepository;

    constructor(private readonly supabase: SupabaseServerClient) {
        this.profiles = new ProfileRepository(supabase);
    }

    /** Devuelve `true` si las credenciales son válidas. */
    async signIn(email: string, password: string): Promise<boolean> {
        const { error } = await this.supabase.auth.signInWithPassword({ email, password });
        return !error;
    }

    async signOut(): Promise<void> {
        await this.supabase.auth.signOut();
    }

    /** Sesión verificada contra Supabase (no solo leyendo la cookie) + perfil activo. */
    async getSession(): Promise<SessionState> {
        const { data } = await this.supabase.auth.getUser();
        if (!data.user) return { kind: "anonymous" };

        const profile = await this.profiles.findById(data.user.id);
        if (!profile?.isActive) return { kind: "inactive" };

        const { isActive: _isActive, ...user } = profile;
        return { kind: "active", user };
    }
}