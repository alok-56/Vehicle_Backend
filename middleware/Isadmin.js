const Adminmodel = require("../models/admin.model");
const AppError = require("../utilits/appError");
const { decryptData } = require("../utilits/Encryption");
const VerifyToken = require("../utilits/verifyToken");

const Isadmin = async (req, res, next) => {
  try {
    let { token } = req.headers;
    if (!token) {
      return next(new AppError("unauthorized user", 401));
    }

    let decypttoken = decryptData(token);
    let { data } = await VerifyToken(decypttoken);

    let user = await Adminmodel.findById(data);
    if (!user) {
      return next(new AppError("unauthorized user or invailed token", 401));
    }
    if (user.isBlocked) {
      return next(new AppError("User is blocked", 403));
    }

    req.admin = user._id;

    next();
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

module.exports = {
  Isadmin,
};
