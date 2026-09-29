import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import allowedOrigins from "./allowedOrigins.js";

let io = null;

// Set up Socket.IO on the HTTP server, authenticated with the same JWT used by REST.
// Each socket joins a `user:<id>` room and one `role:<role>` room per role it holds,
// so notifications can target a specific user or broadcast to a role.
export const initSocket = (httpServer) => {
  // Reuses the same allowed-origins list as the Express CORS config
  // (app.js), including support for a comma-separated FRONTEND_URL with
  // multiple domains. Passing the raw FRONTEND_URL string here directly
  // would break as soon as it contained more than one origin, and
  // origin: "*" is invalid together with credentials: true anyway.
  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // AUTH MIDDLEWARE (mirrors auth.middleware.js)
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];

      if (!token) {
        return next(new Error("Authentication token missing"));
      }

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.user = decoded; // { id, roles, name }
      next();
    } catch (error) {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const { id, roles } = socket.user || {};

    if (id) socket.join(`user:${id}`);
    if (Array.isArray(roles)) {
      roles.forEach((role) => socket.join(`role:${role}`));
    }

    socket.on("disconnect", () => {
      // socket.io cleans up room membership automatically
    });
  });

  return io;
};

/**
 * Get the initialized Socket.IO instance. Returns null if sockets haven't
 * been initialized yet (e.g. during tests) so callers can no-op safely.
 */
export const getIO = () => io;
