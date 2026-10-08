import multer from "multer";

export const MAX_FILE_SIZE_MB = 2;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/jfif",
  "image/png",
  "image/x-png",
  "image/webp",
  "application/pdf",
  "application/x-pdf",
  "application/acrobat",
  "applications/vnd.pdf",
  "text/pdf",
]);

const ALLOWED_EXTENSIONS = /\.(jpe?g|png|pdf|webp|jfif)$/i;

const fileFilter = (req, file, cb) => {
  const mimetype = (file.mimetype || "").toLowerCase().split(";")[0].trim();
  const originalname = file.originalname || "";

  const isMimeAllowed = ALLOWED_MIME_TYPES.has(mimetype);
  const isExtAllowed = ALLOWED_EXTENSIONS.test(originalname);

  // Accept if MIME type is allowed or filename extension matches valid document/image type
  if (isMimeAllowed || isExtAllowed) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES }, // 2MB
  fileFilter,
});

export default upload;
