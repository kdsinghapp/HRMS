import multer from "multer";
import { MAX_FILE_SIZE_MB } from "../services/uploads.js";

const errorHandler = (err, req, res, next) => {
  // Handle Multer upload errors (such as file size limit exceeded)
  if (err instanceof multer.MulterError || err.name === "MulterError" || err.code === "LIMIT_FILE_SIZE") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: `File size must be ${MAX_FILE_SIZE_MB} MB or less.`,
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message || "File upload error",
    });
  }

  // Handle custom file filter errors
  if (err.message === "Invalid file type") {
    return res.status(400).json({
      success: false,
      message: "Invalid file type. Only JPEG, PNG, and PDF files are allowed.",
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};

export default errorHandler;