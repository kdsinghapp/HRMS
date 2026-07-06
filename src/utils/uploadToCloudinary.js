import streamifier from "streamifier";
import cloudinary from "../config/cloudinary.js";

export const uploadToCloudinary = (file, folder) => {
  return new Promise((resolve, reject) => {

    const isPDF = file.mimetype === "application/pdf";

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto", // ✅ auto detects PDF vs image
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    // ✅ FIX: Ensure Buffer
    const buffer = Buffer.isBuffer(file.buffer)
      ? file.buffer
      : Buffer.from(file.buffer);

    streamifier.createReadStream(buffer).pipe(stream);
  });
};