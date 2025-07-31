const Bookingsmodel = require("../models/booking.model");
const Mechanicmodel = require("../models/mechanic.model");
const APPLICATION_CONSTANT = require("../constant/application_constant");
const { getIO } = require("../utilits/socket");
const startMechanicMatching = require("../utilits/mechnicfind");
const STATUS_CODE = require("../constant/status_code");
const AppError = require("../utilits/appError");

const createEmergencyBooking = async (req, res, next) => {
  try {
    const userid = req.user;
    const { lat, lng, problem, payment_emerg_summary, payment_details } =
      req.body;

    const booking = await Bookingsmodel.create({
      userid,
      userLocation: {
        type: "Point",
        coordinates: [lng, lat],
      },
      problem,
      bookingtype: "emergency",
      status: APPLICATION_CONSTANT.PENDING,
      payment_emerg_summary,
      payment_details,
      triedMechanicIds: [],
    });

    startMechanicMatching(booking._id, lat, lng);

    return res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Booking created. Searching for nearby mechanic...",
      bookingId: booking._id,
    });
  } catch (err) {
    return next(new AppError(err.message, STATUS_CODE.SERVERERROR));
  }
};

const Findservicesmechnic = async (req, res, next) => {
  try {
    let { lat, lng, radiusKm, vehicle_type } = req.body;

    const mechanics = await Mechanicmodel.find({
      isAvailable: true,
      vehicle_type: vehicle_type,
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: radiusKm * 1000,
        },
      },
    });

    return res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Mechanices fetched successfully",
      data: mechanics,
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

const createserviceBooking = async (req, res, next) => {
  try {
    const userid = req.user;
    const {
      lat,
      lng,
      problem,
      payment_ser_summary,
      payment_details,
      mechanicid,
      service_date,
      service_start_time,
      service_end_time,
      services,
    } = req.body;

    if (
      !mechanicid ||
      !service_date ||
      !service_start_time ||
      !service_end_time ||
      !lat ||
      !lng ||
      !services
    ) {
      return next(
        new AppError("Validation error", STATUS_CODE.VALIDATIONERROR)
      );
    }

    const booking = await Bookingsmodel.create({
      userid,
      userLocation: {
        type: "Point",
        coordinates: [lng, lat],
      },
      problem,
      bookingtype: "services",
      status: APPLICATION_CONSTANT.PENDING,
      payment_ser_summary,
      payment_details,
      triedMechanicIds: [],
      mechanicid,
      service_date,
      service_start_time,
      service_end_time,
      services,
    });

    return res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Booking created successfully",
      data: booking,
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

const respondToBooking = async (req, res, next) => {
  try {
    let mechanicId = req.mechanic;
    let userid = req.user;
    const { bookingId, response, cancelreason } = req.body;

    const booking = await Bookingsmodel.findById(bookingId);

    if (response === "ACCEPT") {
      if (!booking || booking.status !== APPLICATION_CONSTANT.PENDING) {
        return next(
          new AppError(
            "invalied or expired booking",
            STATUS_CODE.VALIDATIONERROR
          )
        );
      }

      booking.status = APPLICATION_CONSTANT.ACCEPTED;
      booking.mechanicid = mechanicId;
      booking.triedMechanicIds = [];
      await booking.save();
      const mechanic = await Mechanicmodel.findById(mechanicId);
      getIO.io.to(booking.userid.toString()).emit("bookingAccepted", {
        bookingId,
        mechanicId,
        mechanicLocation: mechanic.location.coordinates,
      });

      return res
        .status(STATUS_CODE.SUCCESS)
        .json({ status: true, message: "Booking accepted." });
    }

    if (response === "MECHANICCANCEL") {
      if (booking.status !== APPLICATION_CONSTANT.ACCEPTED) {
        return next(
          new AppError("Booking not accepted yet", STATUS_CODE.VALIDATIONERROR)
        );
      }
      booking.status = APPLICATION_CONSTANT.CANCELLED;
      await booking.save();

      getIO.io.to(booking.userid.toString()).emit("bookingcancel", {
        bookingId,
        mechanicId,
      });

      res.status(STATUS_CODE.SUCCESS).json({
        status: true,
        message: "Booking cancel by mechanic",
      });
    }

    if (response === "USERCANCEL") {
      booking.status = APPLICATION_CONSTANT.CANCELLED;
      booking.cancelled_remarks = cancelreason;
      await booking.save();

      getIO.io.to(mechanicId.toString()).emit("usercancel", {
        bookingId,
        mechanicId,
      });

      res.status(STATUS_CODE.SUCCESS).json({
        status: true,
        message: "Booking cancel by user",
      });
    }

    if (response === "GENERATELINK") {
      //
    }

    if (response === "PAY") {
    }

    if (response === "TAKECASH") {
    }

    if (response === "BOOKINGCOMPLETED") {
      booking.status = APPLICATION_CONSTANT.COMPLETED;
      await booking.save();

      getIO.io.to(booking.userid.toString()).emit("completed", {
        bookingId,
        mechanicId,
      });

      res.status(STATUS_CODE.SUCCESS).json({
        status: true,
        message: "Booking completed",
      });
    }
  } catch (err) {
    return next(new AppError(err.message, STATUS_CODE.SERVERERROR));
  }
};

const Addaditionalservice = async (req, res, next) => {
  try {
    let { id } = req.params;
    let { additional_services, payment_emerg_summary, payment_details } =
      req.body;

    let booking = await Bookingsmodel.findById(id);
    if (!booking || booking.status === APPLICATION_CONSTANT.COMPLETED) {
      return next(new AppError("Invailed booking or Booking is completed"));
    }

    let updatedbooking = await Bookingsmodel.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    return res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Booking updated successfully",
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

const GetAllbooking = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status) {
      query.status = status;
    }

    const [bookings, total] = await Promise.all([
      Bookingsmodel.find(query)
        .skip(parseInt(skip))
        .limit(parseInt(limit))
        .sort({ createdAt: -1 })
        .populate("userid", "name email phone")
        .populate("mechanicid", "name phone"),
      Bookingsmodel.countDocuments(query),
    ]);

    res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Bookings fetched",
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: bookings,
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

const GetUserbooking = async (req, res, next) => {
  try {
    const userId = req.user;
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const query = { userid: userId };
    if (status) {
      query.status = status;
    }

    const [bookings, total] = await Promise.all([
      Bookingsmodel.find(query)
        .skip(parseInt(skip))
        .limit(parseInt(limit))
        .sort({ createdAt: -1 })
        .populate("mechanicid", "name phone"),
      Bookingsmodel.countDocuments(query),
    ]);

    res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "User bookings fetched",
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: bookings,
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

const GetMechnicbooking = async (req, res, next) => {
  try {
    const mechanicId = req.mechanic;
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const query = { mechanicid: mechanicId };
    if (status) {
      query.status = status;
    }

    const [bookings, total] = await Promise.all([
      Bookingsmodel.find(query)
        .skip(parseInt(skip))
        .limit(parseInt(limit))
        .sort({ createdAt: -1 })
        .populate("userid", "name phone"),
      Bookingsmodel.countDocuments(query),
    ]);

    res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Mechanic bookings fetched",
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: bookings,
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

module.exports = {
  createEmergencyBooking,
  respondToBooking,
  Addaditionalservice,
  Findservicesmechnic,
  createserviceBooking,
  GetAllbooking,
  GetUserbooking,
  GetMechnicbooking,
};
