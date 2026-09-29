import jwt from "jsonwebtoken";
import SystemSettings from "../models/systemSettings.model.js";

// Paths that must always stay reachable even while maintenance mode is on:
// - /api/auth      → so people can still log in (and so Admin can log in)
// - /api/admin-panel → so Admin can manage the system, including turning
//   maintenance mode back off
// - /api/system-status → the lightweight public endpoint the frontend polls
//   to know whether maintenance is on and what message to show
const ALWAYS_ALLOWED_PREFIXES = ["/api/auth", "/api/admin-panel", "/api/system-status"];

// Settings rarely change request-to-request, so we cache them briefly
// instead of hitting the DB on every single API call.
let cache = { value: null, expiresAt: 0 };
const CACHE_TTL_MS = 15000;

const getCachedSettings = async () => {
  if (cache.value && Date.now() < cache.expiresAt) {
    return cache.value;
  }
  const settings = await SystemSettings.findOne({ singletonKey: "GLOBAL" });
  cache = { value: settings, expiresAt: Date.now() + CACHE_TTL_MS };
  return settings;
};

// Exported so the Admin Panel's update endpoint can force-refresh this
// immediately after toggling the setting, instead of waiting out the cache.
export const invalidateSystemSettingsCache = () => {
  cache = { value: null, expiresAt: 0 };
};

export const checkMaintenanceMode = async (req, res, next) => {
  try {
    if (ALWAYS_ALLOWED_PREFIXES.some((prefix) => req.originalUrl.startsWith(prefix))) {
      return next();
    }

    const settings = await getCachedSettings();
    if (!settings?.maintenanceMode?.enabled) {
      return next();
    }

    // Admin always bypasses maintenance mode so they can keep working/turn
    // it back off. Verify the token properly here (rather than a cheap
    // decode) since this is a real access-control decision.
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        if (decoded?.roles?.includes("admin")) {
          return next();
        }
      } catch {
        // invalid/expired token — fall through to the maintenance block
      }
    }

    return res.status(503).json({
      success: false,
      maintenance: true,
      message: settings.maintenanceMode.message,
    });
  } catch (error) {
    // If the maintenance check itself fails, fail OPEN rather than taking
    // the whole app down over a settings-lookup error.
    return next();
  }
};
