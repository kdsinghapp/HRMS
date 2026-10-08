import streamifier from "streamifier";
import cloudinary from "../config/cloudinary.js";

export const uploadToCloudinary = (file, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto", // auto detects PDF vs image
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    // Ensure Buffer whether 'file' is a Multer file object or raw Buffer
    const buffer = Buffer.isBuffer(file)
      ? file
      : Buffer.isBuffer(file?.buffer)
        ? file.buffer
        : Buffer.from(file?.buffer || file || []);

    streamifier.createReadStream(buffer).pipe(stream);
  });
};