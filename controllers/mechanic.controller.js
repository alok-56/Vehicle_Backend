const APPLICATION_CONSTANT = require("../constant/application_constant");
const STATUS_CODE = require("../constant/status_code");
const Mechanicmodel = require("../models/mechanic.model");
const Otpmodel = require("../models/otp.model");
const Referralmodel = require("../models/referral.model");
const AppError = require("../utilits/appError");
const SendEmail = require("../utilits/email/sendEmail");
const GenerateToken = require("../utilits/generateToken");

// Create user Otp send
const CreateMechanic = async (req, res, next) => {
  try {
    let { name, email, phone_number, vehicle_type, type, referral_code } =
      req.body;

    // login logic
    if (type === "login") {
      // check email
      let checkemail = await Mechanicmodel.findOne({
        email: email,
      });
      if (!checkemail) {
        return next(new AppError("User not found", STATUS_CODE.NOTFOUND));
      }

      // otp generation
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      let otpcreation = await Otpmodel.create({
        otp: otp,
        email: email,
      });

      // send email

      res.status(STATUS_CODE.SUCCESS).json({
        status: true,
        message: "Otp send successfully",
      });
    }
    // resister logic
    else {
      // check vehicle
      if (
        ![
          APPLICATION_CONSTANT.CAR,
          APPLICATION_CONSTANT.BIKE,
          APPLICATION_CONSTANT.BUS,
          APPLICATION_CONSTANT.AUTO,
          APPLICATION_CONSTANT.TRUCK,
        ].includes(vehicle_type)
      ) {
        return next(
          new AppError("vechile not matched", STATUS_CODE.VALIDATIONERROR)
        );
      }

      // check referral code
      if (referral_code) {
        let referraluser = await Mechanicmodel.findOne({
          referral_code: referral_code,
        });
        if (!referraluser) {
          return next(
            new AppError("Invailed referral code ", STATUS_CODE.VALIDATIONERROR)
          );
        }
      }

      // check email
      let checkemail = await Mechanicmodel.findOne({
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
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
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
const VerifyMechanic = async (req, res, next) => {
  try {
    let {
      name,
      email,
      phone_number,
      vehicle_type,
      type,
      otp,
      referral_code,
      token,
    } = req.body;
    if (type === "login") {
      // user check
      let user = await Mechanicmodel.findOne({ email: email });
      if (!user) {
        return next(new AppError("User not  found", STATUS_CODE.NOTFOUND));
      }

      // otp check
      let fetchotp = await Otpmodel.findOne({ email: email, otp: otp });
      if (fetchotp) {
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
      });
    } else {
      // otp check
      let fetchotp = await Otpmodel.findOne({ email: email, otp: otp });
      if (fetchotp) {
        return next(new AppError("Incorrect otp", STATUS_CODE.VALIDATIONERROR));
      }
      const referaalcode = Math.floor(
        100000 + Math.random() * 900000
      ).toString();

      let newuser = await Mechanicmodel.create({
        name: name,
        email: email,
        phone_number: phone_number,
        referral_code: referaalcode,
        vehicle_type: vehicle_type,
        isemailverified: true,
      });

      // create referral
      await Referralmodel.create({
        userid: newuser._id,
        refer_code: referral_code,
      });

      // token generation
      let token = await GenerateToken(newuser._id);

      // delete otp
      await Otpmodel.findByIdAndDelete(fetchotp._id);

      res.status(STATUS_CODE.SUCCESS).json({
        status: true,
        message: "User logedin successfully",
        token: token,
      });
    }
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

// send for verification
const Sendforverification = async (req, res, next) => {
  try {
    let id = req.mechanic;
    const { documents, shop_details, payment_details } = req.body;
    if (!documents || !shop_details || !payment_details) {
      return next(new AppError("missing fields", STATUS_CODE.VALIDATIONERROR));
    }

    // check mechanic
    let mechanic = await Mechanicmodel.findById(id);
    if (!mechanic) {
      return next(new AppError("user not found", STATUS_CODE.NOTFOUND));
    }

    const updatedata = {};
    if (documents) updatedata.documents = documents;
    if (shop_details) updatedata.shop_details = shop_details;
    if (payment_details) updatedata.payment_details;
    if (mechanic.status === APPLICATION_CONSTANT.PENDING) {
      updatedata.status = APPLICATION_CONSTANT.SENDFORVERIFICATION;
    } else if (mechanic.status === APPLICATION_CONSTANT.SENDFORVERIFICATION) {
      updatedata.status = APPLICATION_CONSTANT.RESENDFORVERIFICATION;
    }

    await Mechanicmodel.findByIdAndUpdate(updatedata);

    return res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Your application is successfully send for verification",
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

// approve/reject verification
const Checkapplication = async (req, res, next) => {
  try {
    let { id, status, remarks } = req.body;
    if (
      ![APPLICATION_CONSTANT.APPROVE, APPLICATION_CONSTANT.REJECTED].includes(
        status
      )
    ) {
      return next(new AppError("Invailed status", STATUS_CODE.VALIDATIONERROR));
    }

    await Mechanicmodel.findByIdAndUpdate(
      id,
      {
        status: status,
        remarks: remarks,
      },
      { new: true }
    );

    return res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "User updated successfully",
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

// get all Mechanic
const GetallMechanic = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      Mechanicmodel.find().skip(skip).limit(limit).lean(),
      Mechanicmodel.countDocuments(),
    ]).select("name");

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

// block Mechanic
const blockMechanic = async (req, res, next) => {
  try {
    let { id } = req.params;
    if (!id) {
      return next(new AppError("id is required", STATUS_CODE.NOTFOUND));
    }

    let blockeduser = await Mechanicmodel.findByIdAndUpdate(
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

// delete Mechanic
const DeleteMechanic = async (req, res, next) => {
  try {
    let { id } = req.params;
    if (!id) {
      return next(new AppError("id is required", STATUS_CODE.NOTFOUND));
    }

    await Mechanicmodel.findByIdAndDelete(id);

    return res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "user deleted successfully",
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

// get mechanic own data
const Mechanicowndata = async (req, res, next) => {
  try {
    let id = req.mechanic;

    let data = await Mechanicmodel.findById(id);

    return res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "data fetched successfully",
      data: data,
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

module.exports = {
  CreateMechanic,
  VerifyMechanic,
  GetallMechanic,
  blockMechanic,
  DeleteMechanic,
  Sendforverification,
  Checkapplication,
  Mechanicowndata,
};
