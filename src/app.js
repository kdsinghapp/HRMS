import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import allowedOrigins from "./config/allowedOrigins.js";
import { checkMaintenanceMode } from "./middlewares/maintenance.middleware.js";
import limiter from "./middlewares/rateLimiter.middleware.js";
import errorHandler from "./middlewares/error.middleware.js";
import notFound from "./middlewares/notFound.middleware.js";

// Routes
import visitorRoutes from "./routes/visitor.Routes.js";
import authRoutes from "./routes/auth.routes.js";
import employeeRoutes from "./routes/employee.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import superAdminRoutes from "./routes/superAdmin.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import candidateResumeRoutes from "./routes/candidateResume.routes.js";
import interviewRoutes from "./routes/interview.routes.js";
import jobRoutes from "./routes/job.routes.js";
import oldEmployeeRoutes from "./routes/oldEmployee.Routes.js";
import salaryRoutes from "./routes/salary.routes.js";
import salaryStructureRoutes from "./routes/SalaryStructure.routes.js";
import leaveRoutes from "./routes/leave.routes.js";
import supportRoutes from "./routes/support.routes.js";
import auditLogRoutes from "./routes/auditLog.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import resumeScreeningRoutes from "./routes/resumeScreening.routes.js";
import systemStatusRoutes from "./routes/systemStatus.routes.js";

const app = express();

/* Trust Proxy for production deployments behind load balancers/proxies (Render, Vercel, Nginx, AWS) */
app.set("trust proxy", 1);

/* Security Headers */
app.use(helmet());

/* Compression */
app.use(compression());

/* Logging */
if (process.env.NODE_ENV === "production") {
  app.use(morgan("combined"));
} else {
  app.use(morgan("dev"));
}

/* Body Parsing */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

/* CORS Configuration */
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked: Origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

/* Rate Limiting */
// app.use("/api", limiter);

/* Maintenance Mode Middleware */
app.use(checkMaintenanceMode);

/* Health Check */
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "UP",
    timestamp: new Date().toISOString(),
  });
});

/* API Endpoints */
app.use("/api/visitor", visitorRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin-panel", superAdminRoutes);
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/candidate-resumes", candidateResumeRoutes);
app.use("/api/candidateResumes", candidateResumeRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/oldEmployees", oldEmployeeRoutes);
app.use("/api/salary", salaryRoutes);
app.use("/api/salary/structures", salaryStructureRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/resume-screening", resumeScreeningRoutes);
app.use("/api/system-status", systemStatusRoutes);

/* 404 Handler */
app.use(notFound);

/* Global Error Handler */
app.use(errorHandler);

export default app;
