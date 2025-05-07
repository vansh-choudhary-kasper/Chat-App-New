const multer = require("multer");
const path = require("path");

// Set storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads"); // Store files temporarily in 'uploads' directory
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(
      null,
      `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

const fileFilter = (req, file, cb) => {
  const allowedFileTypes =
    /jpeg|jpg|png|gif|mp4|avi|mov|mkv|zip|rar|pdf|webm|svg/;
  const extname = allowedFileTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(
      new Error("Only images, videos, PDFs, and ZIP files are allowed!"),
      false
    ); // Reject file
  }
};

// Multer upload instance with size limit (100MB for video files)
const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 100 }, // 100MB limit for video files
  fileFilter,
});

module.exports = upload;
