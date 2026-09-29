// ============================================================
// Single source of truth for which frontend origins may talk to
// this API — used by both the Express CORS middleware (app.js)
// and the Socket.IO CORS config (socket.js) so they can never
// drift out of sync with each other.
//
// LOCAL  -> Vite dev server (always allowed so local dev keeps working)
// LIVE   -> Vercel deployment(s) (FRONTEND_URL from .env / Render dashboard).
//           Supports a comma-separated list so previews/multiple domains work.
// ============================================================
const allowedOrigins = [
  "http://localhost:5173",
  ...(process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map((url) => url.trim())
    : []),
].filter(Boolean);

export default allowedOrigins;
