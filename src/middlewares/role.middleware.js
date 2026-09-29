// ROLE-BASED ACCESS CONTROL
// req.user.roles is an array (set in the JWT payload by token.js), e.g.
// ["employee"], ["hr","employee"] or ["admin","hr","employee"].
// A route is accessible if the user holds AT LEAST ONE of the allowed roles.

// ✅ Generic, reusable role guard — pass the roles that may access a route.
//    Example: router.get("/x", authMiddleware, authorizeRoles("hr","admin"), handler)
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const userRoles = req.user?.roles || [];

    const isAllowed = allowedRoles.some((role) => userRoles.includes(role));

    if (!isAllowed) {
      return res.status(403).json({
        message: `Access denied. Allowed roles: ${allowedRoles.join(", ")}.`,
      });
    }

    next();
  };
};

// ✅ Kept for backward compatibility with existing routes that already
// role string.
export const isHrOrAdmin = authorizeRoles("hr", "admin");

// ✅ Strict guard for the Admin Panel — HR must NOT be able to reach these.
// Covers user/role management, department & designation master data,
// system-wide settings, and anything else that controls who can access
// the system rather than day-to-day HR operations.
export const isAdminOnly = authorizeRoles("admin");
