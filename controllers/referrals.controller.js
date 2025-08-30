const STATUS_CODE = require("../constant/status_code");
const Mechanicmodel = require("../models/mechanic.model");
const Referralmodel = require("../models/referral.model");
const Usermodel = require("../models/user.model");
const AppError = require("../utilits/appError");

// Get All My referrals
const GetAllMyreferral = async (req, res, next) => {
  try {
    const { refer_code } = req.query;
    if (!refer_code) {
      return next(
        new AppError("Refer code is required", STATUS_CODE.BADREQUEST)
      );
    }

    // 1. Find all referrals matching the refer_code
    const referrals = await Referralmodel.find({ refer_code });

    // 2. For each referral, check if the userid exists in User or Mechanic
    const populatedReferrals = await Promise.all(
      referrals.map(async (ref) => {
        let user = await Usermodel.findById(ref.userid).select(
          "name email phone_number profilepicture"
        );
        let mechanic = await Mechanicmodel.findById(ref.userid).select(
          "name email phone_number documents.profile_photo"
        );

        return {
          ...ref.toObject(),
          userDetails: user || mechanic || null,
          userType: user ? "user" : mechanic ? "mechanic" : "unknown",
        };
      })
    );

    return res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Referrals fetched successfully",
      data: populatedReferrals,
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

module.exports = GetAllMyreferral;
