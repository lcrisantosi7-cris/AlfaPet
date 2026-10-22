import { z } from "zod";

const schema = z.object({
    SUPABASE_URL: z.url(),
    SUPABASE_ANON_KEY: z.string().min(20),
});

/** Variables validadas al primer uso. Solo existen en el servidor: nunca llegan al navegador. */
export const env = schema.parse({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
});