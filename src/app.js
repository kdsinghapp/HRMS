import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import visitorRoutes from "./routes/visitor.Routes.js";
import authRoutes from "./routes/auth.routes.js";
import employeeRoutes from "./routes/employee.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import interviewRoutes from "./routes/interview.routes.js";
import jobRoutes from "./routes/job.routes.js";
import oldEmployeeRoutes from "./routes/oldEmployee.Routes.js";
import salaryRoutes from "./routes/salary.route.js";
import salaryStructureRoutes from "./routes/SalaryStructure.routes.js";
import leaveRoutes from "./routes/leave.route.js";
import supportRoutes from "./routes/support.routes.js";
import auditLogRoutes from "./routes/auditLog.routes.js";

import limiter from "./middlewares/rateLimiter.middleware.js";
import errorHandler from "./middlewares/error.middleware.js";
import notFound from "./middlewares/notFound.middleware.js";

const app = express();

/* Security */
app.use(helmet());

/* Compression */
app.use(compression());

/* Logging */
// app.use(morgan("combined"));

/* Parsing */
app.use(express.json());
app.use(cookieParser());
console.log("instance",express())

/* Rate Limiting */
// app.use(limiter);

/* CORS */
app.use(cors());

/* Health Check */
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "UP",
    timestamp: new Date(),
  });
});

/* API Versioning */
app.use("/api/visitor", visitorRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/oldEmployees", oldEmployeeRoutes);
app.use("/api/salary", salaryRoutes);
app.use("/api/salary/structures", salaryStructureRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/audit-logs", auditLogRoutes);

/* 404 */
app.use(notFound);

/* Error Handler */
app.use(errorHandler);

export default app;