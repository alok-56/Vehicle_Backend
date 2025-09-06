const APPLICATION_CONSTANT = require("../constant/application_constant");
const STATUS_CODE = require("../constant/status_code");
const Locationmodel = require("../models/locationTrack.model");
const Mastermodel = require("../models/master/master.model");
const Mechanicmodel = require("../models/mechanic.model");
const Otpmodel = require("../models/otp.model");
const Referralmodel = require("../models/referral.model");
const Usermodel = require("../models/user.model");
const AppError = require("../utilits/appError");
const SendEmail = require("../utilits/email/sendEmail");
const { sendNotifications } = require("../utilits/firebase");
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
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      let otpcreation = await Otpmodel.create({
        otp: otp,
        email: email,
      });

      // send email
      await SendEmail(email, "OTP", name, {
        otp: otp,
      });

      return res.status(STATUS_CODE.SUCCESS).json({
        status: true,
        message: "Otp send successfully",
      });
    }
    // resister logic
    else {
      // check referral code

      if (referral_code) {
        let referraluser = await Mechanicmodel.findOne({ referral_code });
        if (!referraluser) {
          referraluser = await Usermodel.findOne({ referral_code });
        }
        if (!referraluser) {
          return next(
            new AppError("Invalid referral code", STATUS_CODE.VALIDATIONERROR)
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
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      let otpcreation = await Otpmodel.create({
        otp: otp,
        email: email,
      });

      // send email
      await SendEmail(email, "OTP", name, {
        otp: otp,
      });

      return res.status(STATUS_CODE.SUCCESS).json({
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
      device_token,
    } = req.body;
    if (type === "login") {
      // user check
      let user = await Mechanicmodel.findOne({ email: email });
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

      await Mechanicmodel.findByIdAndUpdate(user._id, {
        device_token: device_token,
      });

      // delete otp
      await Otpmodel.findByIdAndDelete(fetchotp._id);

      return res.status(STATUS_CODE.SUCCESS).json({
        status: true,
        message: "User logedin successfully",
        token: token,
        isverified: user.status === "approve" ? true : false,
        code: user.referral_code,
        device_token: device_token,
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

      let newuser = await Mechanicmodel.create({
        name: name,
        email: email,
        phone_number: phone_number,
        referral_code: referaalcode,
        vehicle_type: vehicle_type,
        isemailverified: true,
        device_token: device_token,
      });

      let masterearning = await Mastermodel.find();

      // create referral
      if (referral_code) {
        await Referralmodel.create({
          userid: newuser._id,
          refer_code: referral_code,
          earning: masterearning[0]?.referral_bonus,
        });
        let user = await Mechanicmodel.findOne({
          referral_code: referral_code,
        });
        if (!user) {
          user = await Usermodel.findOne({ referral_code: referral_code });
        }
        user.wallet_amount =
          (user.wallet_amount || 0) + (masterearning[0]?.referral_bonus || 0);
        await user.save();
      }

      // token generation
      let token = await GenerateToken(newuser._id);

      // delete otp
      await Otpmodel.findByIdAndDelete(fetchotp._id);

      return res.status(STATUS_CODE.SUCCESS).json({
        status: true,
        message: "User resister successfully",
        token: token,
        code: referaalcode,
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
    const { documents, shop_details, payment_details, location } = req.body;

    if (!documents || !shop_details || !payment_details || !location) {
      return next(new AppError("Missing fields", STATUS_CODE.VALIDATIONERROR));
    }

    let mechanic = await Mechanicmodel.findById(id);
    if (!mechanic) {
      return next(new AppError("User not found", STATUS_CODE.NOTFOUND));
    }

    const updatedata = {};
    if (documents) updatedata.documents = documents;
    if (shop_details) updatedata.shop_details = shop_details;
    if (payment_details) updatedata.payment_details = payment_details;
    if (location) updatedata.location = location;

    if (mechanic.status === APPLICATION_CONSTANT.PENDING) {
      updatedata.status = APPLICATION_CONSTANT.SENDFORVERIFICATION;
    } else if (mechanic.status === APPLICATION_CONSTANT.SENDFORVERIFICATION) {
      updatedata.status = APPLICATION_CONSTANT.RESENDFORVERIFICATION;
    } else if (mechanic.status === APPLICATION_CONSTANT.REJECTED) {
      updatedata.status = APPLICATION_CONSTANT.RESENDFORVERIFICATION;
    }

    await Mechanicmodel.findByIdAndUpdate(id, updatedata, { new: true });

    return res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Your application is successfully sent for verification",
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

    res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "User updated successfully",
    });

    setImmediate(async () => {
      try {
        const user = await Mechanicmodel.findById(id);
        if (user && user.device_token && user.device_token.length) {
          const message = `Your Application Status has been ${status}`;
          await sendNotifications([user.device_token], {
            body: String(message),
            title: String("Application Updated"),
          });
        }
        await SendEmail(user.email, "Applicationupdated", user.name, {
          description: `Your Application Status has been ${status}`,
        });
      } catch (notifError) {
        console.error("Error sending notification:", notifError);
      }
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
    const { status, search } = req.query;

    // Create filter object
    const filter = {};

    if (status) {
      filter.status = status;
    }

    // Search by phone number (partial match)
    if (search) {
      filter.$expr = {
        $regexMatch: {
          input: { $toString: "$phone_number" }, // Convert number to string
          regex: search,
          options: "i",
        },
      };
    }

    const [users, total] = await Promise.all([
      Mechanicmodel.find(filter).skip(skip).limit(limit).lean(),
      Mechanicmodel.countDocuments(filter),
    ]);

    res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Mechanics fetched successfully",
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
    const { id } = req.params;
    if (!id) {
      return next(new AppError("id is required", STATUS_CODE.NOTFOUND));
    }

    // Find user by ID
    const mechanic = await Mechanicmodel.findById(id);
    if (!mechanic) {
      return next(new AppError("User not found", STATUS_CODE.NOTFOUND));
    }

    // Toggle the isBlocked status
    const updatedMechanic = await Mechanicmodel.findByIdAndUpdate(
      id,
      { isBlocked: !mechanic.isBlocked },
      { new: true }
    );

    return res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: `User ${
        updatedMechanic.isBlocked ? "blocked" : "unblocked"
      } successfully`,
      data: updatedMechanic,
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

// Get Own Profile
const GetMechOwnprofile = async (req, res, next) => {
  try {
    const mech = await Mechanicmodel.findById(req.mechanic).select(
      "name email phone_number referral_code vehicle_type documents.profile_photo shop_details wallet_amount"
    );

    if (!mech) {
      return res.status(STATUS_CODE.NOTFOUND).json({
        status: false,
        message: "Mechanic not found",
      });
    }

    res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Mechanic profile fetched successfully",
      data: mech,
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

// Update profile data
const UpdateMechanicProfile = async (req, res, next) => {
  try {
    const {
      name,
      phone_number,
      vehicle_type,
      profile_photo,
      shop_name,
      experience,
      description,
      perHourPrice,
    } = req.body;

    let updateFields = {};

    if (name) updateFields.name = name;
    if (phone_number) updateFields.phone_number = phone_number;
    if (vehicle_type) updateFields.vehicle_type = vehicle_type;
    if (profile_photo) {
      updateFields.documents = { profile_photo };
    }

    // Create shop_details only if any shop field exists
    if (shop_name || experience || description || perHourPrice) {
      updateFields.shop_details = {};
      if (shop_name) updateFields.shop_details.shop_name = shop_name;
      if (experience) updateFields.shop_details.experience = experience;
      if (description) updateFields.shop_details.description = description;
      if (perHourPrice) updateFields.shop_details.perHourPrice = perHourPrice;
    }

    // Update mechanic
    const updatedMechanic = await Mechanicmodel.findByIdAndUpdate(
      req.mechanic,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedMechanic) {
      return next(new AppError("Mechanic not found", STATUS_CODE.NOTFOUND));
    }

    return res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Mechanic profile updated successfully",
      user: updatedMechanic,
    });
  } catch (error) {
    console.error(error);
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

// Update Location
const UpdatemechanicLocation = async (req, res, next) => {
  try {
    let { lat, long } = req.body;
    if (!lat || !long) {
      return next(new AppError("Missing fields", STATUS_CODE.VALIDATIONERROR));
    }

    let location = await Locationmodel.findOne({ mechanicid: req.mechanic });
    if (location) {
      location.lat = lat;
      location.long = long;
      await location.save();
    } else {
      await Locationmodel.create({
        lat: lat,
        long: long,
        mechanicid: req.mechanic,
      });
    }
    return res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      code: 200,
      message: "Location updated successfully",
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

// Get Location
const GetmechanicLocation = async (req, res, next) => {
  try {
    let { mechanicid } = req.query;
    let location = await Locationmodel.findOne({ mechanicid: mechanicid });
    if (!location) {
      return next(new AppError("Location not found", STATUS_CODE.NOTFOUND));
    }
    return res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      code: 200,
      message: "Location fetched successfully",
      data: location,
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

// toggle Mechanic expertise

const ToggleMechanicExpertise = async (req, res, next) => {
  try {
    let { id } = req.params;
    const mechanic = await Mechanicmodel.findById(id);
    if (!mechanic) {
      return next(new AppError("Mechanic not found", STATUS_CODE.NOTFOUND));
    }

    // Toggle the boolean value
    mechanic.isexpert = !mechanic.isexpert;

    await mechanic.save();

    return res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Mechanic expertise toggled successfully",
      data: mechanic,
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
  GetMechOwnprofile,
  UpdateMechanicProfile,
  UpdatemechanicLocation,
  GetmechanicLocation,
  ToggleMechanicExpertise,
};
