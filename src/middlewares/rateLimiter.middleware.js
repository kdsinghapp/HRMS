import rateLimit from "express-rate-limit";

// General limiter — applied to all /api routes in app.js.
// Relies on app.set("trust proxy", 1) in app.js to see real per-user IPs
// (without that, every user shares this single bucket).
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests",
  },
});

// Stricter, dedicated limiter for login/forgot-password so a handful of
// failed/retried login attempts can't burn through the general API quota
// (which would otherwise lock out every other endpoint too), and so
// brute-forcing credentials is meaningfully rate-limited.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again in a few minutes.",
  },
});

// Kept as the default export too, for backwards compatibility with any
// other file that might still `import limiter from ...`.
export default apiLimiter;
