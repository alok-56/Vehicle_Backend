const SosModel = require("../models/sos.model");
const AppError = require("../utilits/appError");
const STATUS_CODE = require("../constant/status_code");

// CREATE SOS
const CreateSos = async (req, res, next) => {
  try {
    const { location, mechanicId } = req.body;
    const userId = req.user;

    const sos = await SosModel.create({
      userId,
      mechanicId,
      location,
    });

    res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "SOS created successfully",
      data: sos,
    });
  } catch (error) {
    next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

// GET ALL SOS
const GetAllSos = async (req, res, next) => {
  try {
    const sosList = await SosModel.find().populate("userId mechanicId");

    res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "All SOS fetched",
      data: sosList,
    });
  } catch (error) {
    next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

// GET SOS BY USER
const GetSosByUser = async (req, res, next) => {
  try {
    const userId = req.user;

    const sosList = await SosModel.find({ userId }).populate("mechanicId");

    res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "User SOS fetched",
      data: sosList,
    });
  } catch (error) {
    next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

// UPDATE SOS STATUS
const UpdateSosStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["active", "resolved"];
    if (!validStatuses.includes(status)) {
      return next(
        new AppError("Invalid status value", STATUS_CODE.VALIDATIONERROR)
      );
    }

    const sos = await SosModel.findByIdAndUpdate(id, { status }, { new: true });

    if (!sos) {
      return next(new AppError("SOS not found", STATUS_CODE.VALIDATIONERROR));
    }

    res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "SOS status updated",
      data: sos,
    });
  } catch (error) {
    next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

// UPDATE SOS (optional)
const UpdateSos = async (req, res, next) => {
  try {
    const { id } = req.params;
    const update = req.body;

    const sos = await SosModel.findByIdAndUpdate(id, update, { new: true });

    if (!sos) {
      return next(new AppError("SOS not found", STATUS_CODE.NOTFOUND));
    }

    res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "SOS updated successfully",
      data: sos,
    });
  } catch (error) {
    next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

module.exports = {
  CreateSos,
  GetAllSos,
  GetSosByUser,
  UpdateSosStatus,
  UpdateSos,
};
