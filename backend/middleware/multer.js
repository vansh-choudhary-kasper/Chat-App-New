const multer = require("multer");
const path = require("path");

// Set storage engine
const storage = multer.memoryStorage();

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
