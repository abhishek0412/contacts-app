const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const redis = require("../config/redis");

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: "rl:global:",
  }),
});

const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many write requests. Please try again later." },
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: "rl:write:",
  }),
});

module.exports = { globalLimiter, writeLimiter };
