import type { Request, Response, NextFunction } from "express";

export const rateLimiter = (windowMs: number, maxTries: number, keyFn?: (req: Request) => string) => {
    const rateLimitMap = new Map<string, { count: number; startTime: number }>();
    setInterval(() => {
        const currentTime = Date.now();
        rateLimitMap.forEach((obj, ip) => {
            if (currentTime - obj.startTime > windowMs) {
                rateLimitMap.delete(ip);
            }
        });
    }, windowMs);

    return (req: Request, res: Response, next: NextFunction) => {
        const key = keyFn ? keyFn(req) : (req.ip ?? "unknown");
        const currentUserObject = rateLimitMap.get(key);
        const currentTime = Date.now();

        if (currentUserObject) {
            if (
                currentTime - currentUserObject.startTime < windowMs &&
                currentUserObject.count >= maxTries
            ) {
                const retryAfter = Math.ceil((currentUserObject.startTime + windowMs - currentTime) / 1000)
                res.set("X-RateLimit-Remaining", "0")
                res.set("Retry-After", String(retryAfter))
                return res.status(429).json({ error: `Too Many Requests` });
            } else if (currentTime - currentUserObject.startTime > windowMs) {
                currentUserObject.count = 1;
                currentUserObject.startTime = currentTime;
            } else {
                currentUserObject.count++;
            }
        } else {
            rateLimitMap.set(key, { count: 1, startTime: currentTime });
        }
        const userObjForRes = rateLimitMap.get(key);
        res.set("X-RateLimit-Limit", String(maxTries))
        res.set("X-RateLimit-Remaining", String(maxTries - userObjForRes!.count))
        res.set("X-RateLimit-Reset", String(Math.ceil((userObjForRes!.startTime + windowMs) / 1000)))
        next();
    };
};