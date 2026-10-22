interface Attempt {
    count: number;
    resetAt: number;
}

const PRUNE_THRESHOLD = 500;

/**
 * Limitador en memoria (1 proceso) para frenar fuerza bruta.
 * Si despliegas varias instancias, implementa la misma interfaz sobre Redis/Upstash.
 */
export class RateLimiter {
    private readonly attempts = new Map<string, Attempt>();

    constructor(
        private readonly max: number,
        private readonly windowMs: number,
    ) { }

    isLimited(key: string): boolean {
        const now = Date.now();
        if (this.attempts.size > PRUNE_THRESHOLD) this.prune(now);

        const entry = this.attempts.get(key);
        if (!entry || entry.resetAt <= now) {
            this.attempts.set(key, { count: 1, resetAt: now + this.windowMs });
            return false;
        }

        entry.count += 1;
        return entry.count > this.max;
    }

    reset(key: string): void {
        this.attempts.delete(key);
    }

    private prune(now: number): void {
        for (const [key, entry] of this.attempts) {
            if (entry.resetAt <= now) this.attempts.delete(key);
        }
    }
}

/** 5 intentos de login cada 15 minutos. */
export const loginLimiter = new RateLimiter(5, 15 * 60 * 1000);