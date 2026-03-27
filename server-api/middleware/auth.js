const crypto = require("crypto");
const admin = require("../config/firebase");
const redis = require("../config/redis");

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const token = header.split("Bearer ")[1];
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const cacheKey = `auth:token:${tokenHash}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      req.userId = JSON.parse(cached).uid;
      return next();
    }

    const decoded = await admin.auth().verifyIdToken(token);
    await redis.set(cacheKey, JSON.stringify({ uid: decoded.uid }), "EX", 300);
    req.userId = decoded.uid;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

module.exports = authMiddleware;
