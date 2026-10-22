const attempts = new Map<string, { count: number; resetAt: number }>();

/**
 * Limitador en memoria (1 proceso). Sirve para frenar fuerza bruta en el login.
 * Si despliegas varias instancias, muévelo a Redis/Upstash.
 */
export function isRateLimited(key: string, max = 5, windowMs = 15 * 60 * 1000) {
    const now = Date.now();
    const entry = attempts.get(key);

    if (!entry || entry.resetAt < now) {
        attempts.set(key, { count: 1, resetAt: now + windowMs });
        return false;
    }
    entry.count += 1;
    return entry.count > max;
}

export const clearRateLimit = (key: string) => attempts.delete(key);