const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads folder exists
const uploadPath = "uploads/";
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const isValid = allowed.test(file.mimetype);
  cb(null, isValid);
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
