const Mastermodel = require("../models/master.model");
const STATUS_CODE = require("../constant/status_code");
const AppError = require("../utilits/appError");

// Create master settings
const createMaster = async (req, res, next) => {
  try {
    const { charge_per_km, platform_fee, commision_percentage } = req.body;

    const exist = await Mastermodel.findOne();
    if (exist) {
      return next(
        new AppError("Master settings already exist", STATUS_CODE.CONFLICT)
      );
    }

    const master = await Mastermodel.create({
      charge_per_km,
      platform_fee,
      commision_percentage,
    });

    res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Master settings created",
      data: master,
    });
  } catch (error) {
    next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

// Update master settings
const updateMaster = async (req, res, next) => {
  try {
    const { id } = req.params;

    const master = await Mastermodel.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!master) {
      return next(
        new AppError("Master settings not found", STATUS_CODE.NOTFOUND)
      );
    }

    res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Master settings updated",
      data: master,
    });
  } catch (error) {
    next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

// Get master settings (latest or only one)
const getMaster = async (req, res, next) => {
  try {
    const master = await Mastermodel.findOne().sort({ createdAt: -1 });

    res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Master settings fetched",
      data: master,
    });
  } catch (error) {
    next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

module.exports = {
  createMaster,
  updateMaster,
  getMaster,
};
