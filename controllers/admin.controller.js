const STATUS_CODE = require("../constant/status_code");
const Adminmodel = require("../models/admin.model");
const AppError = require("../utilits/appError");
const GenerateToken = require("../utilits/generateToken");

// create admin
const CreateAdmin = async (req, res, next) => {
  try {
    let { name, email, password } = req.body;

    // check email
    let emailcheck = await Adminmodel.findOne({ email: email });
    if (emailcheck) {
      return next(
        new AppError(
          "Admin already exists with given email",
          STATUS_CODE.VALIDATIONERROR
        )
      );
    }

    let admin = await Adminmodel.create(req.body);

    return res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Admin created successfully",
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

// login admin
const Adminlogin = async (req, res, next) => {
  try {
    let { email, password } = req.body;

    // check email
    let emailcheck = await Adminmodel.findOne({
      email: email,
      password: password,
    });
    if (!emailcheck) {
      return next(
        new AppError("Invailed Email or password", STATUS_CODE.VALIDATIONERROR)
      );
    }

    let token = await GenerateToken(emailcheck._id);

    return res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Admin Login successfully",
      token: token,
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

// get own profile
const GetAdminownprofile = async (req, res, next) => {
  try {
    let id = req.admin;

    let admin = await Adminmodel.findById(id);
    return res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Admin fetched successfully",
      data: admin,
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

module.exports = {
  CreateAdmin,
  Adminlogin,
  GetAdminownprofile,
};
