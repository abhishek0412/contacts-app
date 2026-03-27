function corsMiddleware(req, res, next) {
  const origin = req.headers.origin;
  if (origin && origin.match(/^http:\/\/localhost:\d+$/)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
}

module.exports = corsMiddleware;
