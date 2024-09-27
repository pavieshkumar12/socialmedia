require("dotenv").config();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "coindiary",
    allowedFormats: ["jpeg", "png", "jpg", "svg","zip", "gif", "mp4", "webm"],
    resource_type: "auto", // or 'video' if 'auto' doesn't work
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 24 * 1024 * 1024, // 24 megabytes
  },
});

// Custom error handling middleware
const handleUploadError = (err, req, res, next) => {
    if (err && err.code === "LIMIT_FILE_SIZE") {
      // Handle file size limit exceeded error
      return res.status(400).json({ message: "File size should not exceed 24MB!" });
    }
    // Pass the error to the next middleware if it's not a file size limit error
    next(err);
  };

module.exports = {
  upload,
  handleUploadError,
};

