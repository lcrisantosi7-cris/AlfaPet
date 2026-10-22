import type { SupabaseServerClient } from "~/core/supabase/client.server";
import type { Role, UserProfile } from "./user.types";

interface ProfileRow {
    id: string;
    full_name: string;
    job_title: string | null;
    role: Role;
    avatar_url: string | null;
    is_active: boolean;
}

const COLUMNS = "id, full_name, job_title, role, avatar_url, is_active";

export class ProfileRepository {
    constructor(private readonly supabase: SupabaseServerClient) { }

    async findById(id: string): Promise<UserProfile | null> {
        const { data } = await this.supabase
            .from("profiles")
            .select(COLUMNS)
            .eq("id", id)
            .single<ProfileRow>();

        return data ? ProfileRepository.toProfile(data) : null;
    }

    private static toProfile(row: ProfileRow): UserProfile {
        return {
            id: row.id,
            name: row.full_name,
            jobTitle: row.job_title ?? "",
            role: row.role,
            avatarUrl: row.avatar_url ?? undefined,
            isActive: row.is_active,
        };
    }
}