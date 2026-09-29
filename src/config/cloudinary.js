import { v2 as cloudinary } from "cloudinary";

// dotenv.config() already runs once via src/config/loadEnv.js (the first
// import in server.js) — no need to call it again here.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export default cloudinary;