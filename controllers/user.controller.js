const APPLICATION_CONSTANT = require("../constant/application_constant");
const STATUS_CODE = require("../constant/status_code");
const Otpmodel = require("../models/otp.model");
const Referralmodel = require("../models/referral.model");
const Usermodel = require("../models/user.model");
const AppError = require("../utilits/appError");
const SendEmail = require("../utilits/email/sendEmail");
const GenerateToken = require("../utilits/generateToken");

// Create user Otp send
const CreateUser = async (req, res, next) => {
  try {
    let { name, email, phone_number, vehicle_type, type, referral_code } =
      req.body;

    // login logic
    if (type === "login") {
      // check email
      let checkemail = await Usermodel.findOne({
        email: email,
      });
      if (!checkemail) {
        return next(new AppError("User not found", STATUS_CODE.NOTFOUND));
      }

      // otp generation
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      let otpcreation = await Otpmodel.create({
        otp: otp,
        email: email,
      });

      // send email
      await SendEmail(email, "OTP", name, {
        otp: otp,
      });

      res.status(STATUS_CODE.SUCCESS).json({
        status: true,
        message: "Otp send successfully",
      });
    }
    // resister logic
    else {
      // check referral code
      if (referral_code) {
        let referraluser = await Usermodel.findOne({
          referral_code: referral_code,
        });
        if (!referraluser) {
          return next(
            new AppError("Invailed referral code ", STATUS_CODE.VALIDATIONERROR)
          );
        }
      }

      // check email
      let checkemail = await Usermodel.findOne({
        $or: [{ email }, { phone_number }],
      });
      if (checkemail) {
        return next(
          new AppError(
            "Email or phone number already registered",
            STATUS_CODE.VALIDATIONERROR
          )
        );
      }

      // otp generation
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      let otpcreation = await Otpmodel.create({
        otp: otp,
        email: email,
      });

      // send email
      await SendEmail(email, "OTP", name, {
        otp: otp,
      });

      res.status(STATUS_CODE.SUCCESS).json({
        status: true,
        message: "Otp send successfully",
      });
    }
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

// verify user
const VerifyUser = async (req, res, next) => {
  try {
    let {
      name,
      email,
      phone_number,
      vehicle_type,
      type,
      otp,
      referral_code,
      brand,
    } = req.body;
    if (type === "login") {
      // user check
      let user = await Usermodel.findOne({ email: email });
      if (!user) {
        return next(new AppError("User not  found", STATUS_CODE.NOTFOUND));
      }

      // otp check
      let fetchotp = await Otpmodel.findOne({ email: email, otp: otp });
      if (!fetchotp) {
        return next(
          new AppError("Incorrect otp or expired", STATUS_CODE.VALIDATIONERROR)
        );
      }

      // token generation
      let token = await GenerateToken(user._id);

      // delete otp
      await Otpmodel.findByIdAndDelete(fetchotp._id);

      res.status(STATUS_CODE.SUCCESS).json({
        status: true,
        message: "User logedin successfully",
        token: token,
         code:user.referral_code
      });
    } else {
      // otp check
      let fetchotp = await Otpmodel.findOne({ email: email, otp: otp });

      if (!fetchotp) {
        return next(new AppError("Incorrect otp", STATUS_CODE.VALIDATIONERROR));
      }
      const referaalcode = Math.floor(
        100000 + Math.random() * 900000
      ).toString();

      let newuser = await Usermodel.create({
        name: name,
        email: email,
        phone_number: phone_number,
        referral_code: referaalcode ? referaalcode : null,
        vehicle_type: vehicle_type,
        vehicle_model: brand,
      });

      if (referral_code) {
        // create referral
        await Referralmodel.create({
          userid: newuser._id,
          refer_code: referral_code,
        });
      }

      // token generation
      let token = await GenerateToken(newuser._id);

      // delete otp
      await Otpmodel.findByIdAndDelete(fetchotp._id);

      res.status(STATUS_CODE.SUCCESS).json({
        status: true,
        message: "User logedin successfully",
        token: token,
        code:referaalcode
      });
    }
  } catch (error) {
    console.log(error);
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

// own profile
const GetOwnprofile = async (req, res, next) => {
  try {
    const user = await Usermodel.findById(req.user);

    res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "user fetched successfully",
      data: user,
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

// get all user
const GetallUser = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      Usermodel.find().skip(skip).limit(limit).lean(),
      Usermodel.countDocuments(),
    ]);

    res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "user fetched successfully",
      currentPage: page,
      totalUsers: total,
      totalPages: Math.ceil(total / limit),
      data: users,
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

// block user
const blockuser = async (req, res, next) => {
  try {
    let { id } = req.params;
    if (!id) {
      return next(new AppError("id is required", STATUS_CODE.NOTFOUND));
    }

    let blockeduser = await Usermodel.findByIdAndUpdate(
      id,
      {
        isBlocked: true,
      },
      { new: true }
    );

    return res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "user blocked successfully",
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

// delete user
const DeleteUser = async (req, res, next) => {
  try {
    let { id } = req.params;
    if (!id) {
      return next(new AppError("id is required", STATUS_CODE.NOTFOUND));
    }

    await Usermodel.findByIdAndDelete(id);

    return res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "user deleted successfully",
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

// update Profile Image
const UpdateProfile = async (req, res, next) => {
  try {
    const { name, phone_number, vehicle_type, vehicle_model, profilepicture } =
      req.body;

    let updateFields = {};

    if (name) updateFields.name = name;
    if (phone_number) updateFields.phone_number = phone_number;
    if (vehicle_type) updateFields.vehicle_type = vehicle_type;
    if (vehicle_model) updateFields.vehicle_model = vehicle_model;
    if (profilepicture) {
      updateFields.profilepicture = profilepicture;
    }

    const updatedUser = await Usermodel.findByIdAndUpdate(
      req.user,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedUser) {
      return next(new AppError("User not found", STATUS_CODE.NOTFOUND));
    }

    return res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.log(error);
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

module.exports = {
  CreateUser,
  VerifyUser,
  GetallUser,
  DeleteUser,
  blockuser,
  GetOwnprofile,
  UpdateProfile,
};
