const Bookingsmodel = require("../models/booking.model");
const Mechanicmodel = require("../models/mechanic.model");
const APPLICATION_CONSTANT = require("../constant/application_constant");
const startMechanicMatching = require("../utilits/mechnicfind");
const STATUS_CODE = require("../constant/status_code");
const AppError = require("../utilits/appError");
const { getIO } = require("../utilits/socket");
const Transactionmodel = require("../models/transaction.model");

const createEmergencyBooking = async (req, res, next) => {
  try {
    const userid = req.user;
    const {
      lat,
      lng,
      problem,
      payment_emerg_summary,
      payment_details,
      vehicletype,
    } = req.body;

    let booking = await Bookingsmodel.create({
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

    booking = await Bookingsmodel.findById(booking._id).populate(
      "userid",
      "name phone_number"
    );

    startMechanicMatching(booking._id, booking, lat, lng, vehicletype);

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
    let {
      lat = "any",
      lng = "any",
      radiusKm = "any",
      vehicle_type,
      date,
      slot,
    } = req.query;

    const bookedMechanics = await Bookingsmodel.find({
      service_date: new Date(date),
      slot: slot,
      status: {
        $in: [
          APPLICATION_CONSTANT.PENDING,
          APPLICATION_CONSTANT.ACCEPTED,
          APPLICATION_CONSTANT.ARRIVED,
        ],
      },
    }).distinct("mechanicid");

    // Step 2: Build dynamic query
    const query = {
      vehicle_type: vehicle_type,
      _id: { $nin: bookedMechanics },
    };

    const isLocationFilterEnabled =
      lat !== "any" && lng !== "any" && radiusKm !== "any";

    if (isLocationFilterEnabled) {
      // const parsedLat = parseFloat(lat);
      // const parsedLng = parseFloat(lng);
      // const parsedRadius = parseFloat(radiusKm) * 1000;
      // query.location = {
      //   $near: {
      //     $geometry: { type: "Point", coordinates: [parsedLng, parsedLat] },
      //     $maxDistance: parsedRadius,
      //   },
      // };
    }

    const mechanics = await Mechanicmodel.find(query);

    return res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Available mechanics fetched successfully",
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
      payment_ser_summary,
      payment_details,
      mechanicid,
      service_date,
      services,
      slot,
    } = req.body;

    if (!mechanicid || !service_date || !lat || !lng || !services || !slot) {
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
      bookingtype: "services",
      status: APPLICATION_CONSTANT.PENDING,
      payment_ser_summary,
      payment_details,
      triedMechanicIds: [],
      mechanicid,
      service_date,
      services,
      slot,
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
    const mechanicId = req.user;
    const { bookingId, response, cancelreason, paymentmethod } = req.body;

    const booking = await Bookingsmodel.findById(bookingId);
    if (!booking) {
      return next(new AppError("Booking not found", STATUS_CODE.NOTFOUND));
    }

    if (response === "ACCEPT") {
      if (booking.status !== APPLICATION_CONSTANT.PENDING) {
        return next(
          new AppError(
            "Invalid or expired booking",
            STATUS_CODE.VALIDATIONERROR
          )
        );
      }

      booking.status = APPLICATION_CONSTANT.ACCEPTED;
      booking.mechanicid = mechanicId;
      booking.triedMechanicIds = [];
      await booking.save();

      const mechanic = await Mechanicmodel.findById(mechanicId);
      getIO().to(booking.userid.toString()).emit("bookingAccepted", {
        bookingId,
        mechanicId,
        mechanicLocation: mechanic.location.coordinates,
      });

      return res
        .status(STATUS_CODE.SUCCESS)
        .json({ status: true, message: "Booking accepted." });
    }

    if (response === "MECHANICCANCEL") {
      booking.status = APPLICATION_CONSTANT.CANCELLED;
      await booking.save();

      getIO().to(booking.userid.toString()).emit("bookingcancel", {
        bookingId,
        mechanicId,
      });

      return res.status(STATUS_CODE.SUCCESS).json({
        status: true,
        message: "Booking cancelled by mechanic",
      });
    }

    if (response === "USERCANCEL") {
      booking.status = APPLICATION_CONSTANT.CANCELLED;
      booking.cancelled_remarks = cancelreason;
      await booking.save();

      getIO().to(mechanicId.toString()).emit("usercancel", {
        bookingId,
        mechanicId,
      });

      return res.status(STATUS_CODE.SUCCESS).json({
        status: true,
        message: "Booking cancelled by user",
      });
    }

    if (response === "BOOKINGCOMPLETED") {
      const transactionStatus =
        paymentmethod === APPLICATION_CONSTANT.CASH
          ? APPLICATION_CONSTANT.PAID
          : APPLICATION_CONSTANT.PENDING;

      booking.status = APPLICATION_CONSTANT.COMPLETED;
      booking.payment_status = transactionStatus;

      await Transactionmodel.create({
        bookingId: booking._id,
        userId: booking.userid,
        mechnaicId: booking.mechanicid,
        amount:
          paymentmethod === "cash"
            ? booking.payment_details?.totalamount
            : booking.payment_details?.paidamount || 0,
        paymentMethod: paymentmethod,
        status: transactionStatus,
        transactionId: "",
        paymentDetails: {
          totalAmount: booking.payment_details?.totalamount || 0,
          discount: booking.payment_details?.discount || 0,
          paidAmount:
            paymentmethod === "cash"
              ? booking.payment_details?.totalamount
              : booking.payment_details?.paidamount || 0,
          dueAmount:
            paymentmethod === "cash"
              ? 0
              : booking.payment_details?.dueamount || 0,
          method: paymentmethod,
        },
      });

      await booking.save();

      getIO().to(booking.userid.toString()).emit("completed", {
        bookingId,
        mechanicId,
      });

      return res.status(STATUS_CODE.SUCCESS).json({
        status: true,
        message: "Booking completed",
      });
    }

    return next(new AppError("Invalid response type", STATUS_CODE.BADREQUEST));
  } catch (err) {
    return next(new AppError(err.message, STATUS_CODE.SERVERERROR));
  }
};

const Addaditionalservice = async (req, res, next) => {
  try {
    let { id } = req.params;
    let {
      additional_services,
      payment_emerg_summary,
      payment_details,
      services,
      payment_ser_summary,
    } = req.body;

    let booking = await Bookingsmodel.findById(id);
    if (!booking) {
      return next(new AppError("Invailed booking"));
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
    if (status !== "all") {
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
    if (status !== "all") {
      query.status = status;
    }

    const [bookings, total] = await Promise.all([
      Bookingsmodel.find(query)
        .skip(parseInt(skip))
        .limit(parseInt(limit))
        .sort({ createdAt: -1 })
        .populate("userid", "name phone_number")
        .populate("slot"),
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

const GetUserPayments = async (req, res, next) => {
  try {
    const userId = req.user;
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const query = { userId: userId };
    if (status !== "all") {
      query.status = status;
    }

    const [bookings, total] = await Promise.all([
      Transactionmodel.find(query)
        .select(
          "status paymentDetails paymentMethod bookingId transactionId amount"
        )
        .skip(parseInt(skip))
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      Transactionmodel.countDocuments(query),
    ]);

    res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "User payments fetched",
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: bookings,
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

// get user active booking emergency
const GetUseractivebooking = async (req, res, next) => {
  try {
    const userId = req.user;

    const query = {
      userid: userId,
      status: { $in: ["pending", "accecpted", "arrived"] },
    };

    const [bookings, total] = await Promise.all([
      Bookingsmodel.find(query)
        .sort({ createdAt: -1 })
        .populate("mechanicid", "name phone_number documents"),
      Bookingsmodel.countDocuments(query),
    ]);

    res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Active user bookings fetched",
      data: bookings,
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

// get mechnaic  active booking emergency
const GetMechnicactivebooking = async (req, res, next) => {
  try {
    const mechanicId = req.mechanic;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Base query: accepted emergency bookings
    const baseQuery = {
      mechanicid: mechanicId,
      bookingtype: "emergency",
      status: APPLICATION_CONSTANT.ACCEPTED,
    };

    // Fetch all accepted emergency bookings (active ones)
    const bookings = await Bookingsmodel.find(baseQuery)
      .sort({ createdAt: -1 })
      .populate("userid", "name phone_number")
      .populate("slot");

    // Today's bookings filter (created today)
    const todayQuery = {
      ...baseQuery,
      createdAt: { $gte: startOfToday, $lte: endOfToday },
    };

    const todaysBookings = await Bookingsmodel.find(todayQuery);

    // Calculate total earnings (sum of paidamount from payment_details)
    const todaysEarnings = todaysBookings.reduce((sum, booking) => {
      const paid = booking.payment_details?.paidamount || 0;
      return sum + paid;
    }, 0);

    res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Emergency accepted bookings fetched",
      total: bookings.length,
      data: bookings,
      todayBookingCount: todaysBookings.length,
      todayEarnings: todaysEarnings,
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
  GetUserPayments,
  GetMechnicactivebooking,
  GetUseractivebooking,
};
