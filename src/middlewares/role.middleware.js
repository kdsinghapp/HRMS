


export const isHrOrAdmin = (req, res, next) => {
  const allowedRoles = ["hr", "admin"];

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      message: "Access denied. HR or Admin only.",
    });
  }

  next();
};
