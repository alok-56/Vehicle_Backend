const express = require("express");
const upload = require("../middleware/fileupload");
const {
  Uploadsingle,
  Uploadmultiple,
  deleteImageFromCloudinary,
} = require("../controllers/fileupload.controller");

const fileRouter = express.Router();

fileRouter.post("/single", upload.single("Image"), Uploadsingle);

fileRouter.post(
  "/multiple",
  upload.fields([{ name: "Image", maxCount: 30 }]),
  Uploadmultiple
);

fileRouter.delete("/delete", deleteImageFromCloudinary);

module.exports = fileRouter;
