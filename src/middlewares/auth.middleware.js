import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    // console.log("AUTH HEADER:", authHeader);

    const token = authHeader?.split(" ")[1];
    // console.log("TOKEN:", token);

    if (!token) {
      return res.status(401).json({
        message: "Token missing",
      });
    }

    // ✅ SAME secret jo login me use hua
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    req.user = decoded; // { id, role }
    // console.log("decoded", decoded);
    next();
  } catch (error) {
    console.error("AUTH ERROR 👉", error.message);
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};
