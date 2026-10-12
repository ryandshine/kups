import { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  /** Lebar jendela dalam milidetik. */
  windowMs: number;
  /** Jumlah maksimum permintaan per IP dalam satu jendela. */
  max: number;
  /** Path (relatif terhadap titik mount) yang tidak dibatasi, mis. '/health'. */
  skip?: string[];
}

/**
 * Pembatas laju sederhana (fixed window per IP, in-memory).
 * Cukup untuk satu instance di belakang Traefik; set `trust proxy` agar req.ip
 * berisi IP klien asli, bukan IP proxy.
 */
export function rateLimit({ windowMs, max, skip = [] }: RateLimitOptions) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  }, windowMs);
  sweep.unref();

  return (req: Request, res: Response, next: NextFunction) => {
    if (skip.includes(req.path)) return next();

    const now = Date.now();
    const key = req.ip || 'unknown';
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count++;

    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(Math.max(0, max - entry.count)));

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({ error: 'Terlalu banyak permintaan. Silakan coba lagi beberapa saat.' });
    }
    next();
  };
}
