import jwt from "jsonwebtoken";

export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id.toString(),
      // ✅ multi-role array (e.g. ["hr","employee"], ["admin","hr","employee"])
      roles: user.roles || [],
      name: user?.personal?.fullName || "User",
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "30d" }
  );
};
