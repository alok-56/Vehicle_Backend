const AppError = require("../utilits/appError");
const STATUS_CODE = require("../constant/status_code");
const Slotmodel = require("../models/slot.model");

// Create Slot
const CreateSlot = async (req, res, next) => {
  try {
    const { no_of_hour, starttime, endtime } = req.body;

    if (!no_of_hour || !starttime || !endtime) {
      return next(
        new AppError("All fields are required", STATUS_CODE.VALIDATIONERROR)
      );
    }

    const newSlot = await Slotmodel.create({ no_of_hour, starttime, endtime });

    return res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Slot created successfully",
      data: newSlot,
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

const EdidtSlot = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { no_of_hour, starttime, endtime } = req.body;

    if (!id) {
      return next(
        new AppError("Slot ID is required", STATUS_CODE.VALIDATIONERROR)
      );
    }

    const slot = await Slotmodel.findById(id);
    if (!slot) {
      return next(new AppError("Slot not found", STATUS_CODE.NOTFOUND));
    }

    if (no_of_hour) slot.no_of_hour = no_of_hour;
    if (starttime) slot.starttime = starttime;
    if (endtime) slot.endtime = endtime;

    await slot.save();

    return res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Slot updated successfully",
      data: slot,
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

const GetAllSlots = async (req, res, next) => {
  try {
    const slots = await Slotmodel.find().sort({ createdAt: -1 });

    return res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Slots fetched successfully",
      data: slots,
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

const DeleteSlot = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return next(
        new AppError("Slot ID is required", STATUS_CODE.VALIDATIONERROR)
      );
    }

    const deleted = await Slotmodel.findByIdAndDelete(id);

    if (!deleted) {
      return next(new AppError("Slot not found", STATUS_CODE.NOTFOUND));
    }

    return res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Slot deleted successfully",
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

module.exports = {
  CreateSlot,
  GetAllSlots,
  DeleteSlot,
  EdidtSlot
};
