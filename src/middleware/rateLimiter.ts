import type { Request, Response, NextFunction } from "express";

export const rateLimiter = (limit: number, maxTries: number) => {
  const rateLimitMap = new Map<string, { count: number; startTime: number }>();
  setInterval(() => {
    const currentTime = Date.now();
    rateLimitMap.forEach((obj, ip) => {
      if (currentTime - obj.startTime > limit) {
        rateLimitMap.delete(ip);
      }
    });
  }, limit);

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip ?? "unknown";
    const currentUserObject = rateLimitMap.get(ip);
    const currentTime = Date.now();

    if (currentUserObject) {
      if (
        currentTime - currentUserObject.startTime < limit &&
        currentUserObject.count >= maxTries
      ) {
        return res.status(429).json({ error: `Too Many Requests` });
      } else if (currentTime - currentUserObject.startTime > limit) {
        currentUserObject.count = 1;
        currentUserObject.startTime = currentTime;
      } else {
        currentUserObject.count++;
      }
    } else {
      rateLimitMap.set(ip, { count: 1, startTime: currentTime });
    }
    next();
  };
};