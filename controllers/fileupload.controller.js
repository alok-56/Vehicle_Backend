const AppError = require("../utilits/appError");

const cloudinary = require("cloudinary").v2;

const Uploadmultiple = async (req, res, next) => {
  try {
    // Check if files were uploaded
    if (!req.files || Object.keys(req.files).length === 0) {
      return next(new AppError("No files uploaded", 400));
    }
    const image = req.files["Image"]?.map((file) => file.path);

    return res.status(200).json({
      status: true,
      code: 200,
      message: "File Uploaded successfully",
      data: image,
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

const Uploadsingle = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError("Image is required", 400));
    }

    req.body.Image = req.file.path;

    return res.status(200).json({
      status: true,
      code: 200,
      message: "File Uploaded successfully",
      data: req.file.path,
    });
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

const deleteImageFromCloudinary = async (req, res, next) => {
  try {
    let { imageUrl } = req.query;
    const publicId = imageUrl.split("/").pop().split(".")[0];
    await cloudinary.uploader.destroy(publicId);

    return res.status(200).json({
      status: true,
      code: 200,
      message: "File deleted successfully",
    });
  } catch (error) {
    return nextTick(new AppError(error.message, 500));
  }
};

module.exports = {
  Uploadsingle,
  Uploadmultiple,
  deleteImageFromCloudinary,
};
