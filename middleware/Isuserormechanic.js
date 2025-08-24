const Usermodel = require("../models/user.model");
const Mechanicmodel = require("../models/mechanic.model");
const AppError = require("../utilits/appError");
const { decryptData } = require("../utilits/Encryption");
const VerifyToken = require("../utilits/verifyToken");

const Isuserormechanic = async (req, res, next) => {
  try {
    let { token } = req.headers;
    if (!token) {
      return next(new AppError("Unauthorized user", 401));
    }

    // Decrypt and verify token
    let decryptedToken = decryptData(token);
    let { data } = await VerifyToken(decryptedToken);

    // Check in both collections
    let user = await Usermodel.findById(data);
    let mechanic = await Mechanicmodel.findById(data);


    if (!user && !mechanic) {
      return next(new AppError("Unauthorized user or invalid token", 401));
    }

    // Block check
    if ((user && user.isBlocked) || (mechanic && mechanic.isBlocked)) {
      return next(new AppError("User is blocked", 403));
    }

    // Attach ID and role to request
    req.user = data;

    next();
  } catch (error) {
    return next(new AppError(error.message, 500));
  }
};

module.exports = {
  Isuserormechanic,
};
