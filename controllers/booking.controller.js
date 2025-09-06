const Bookingsmodel = require("../models/booking.model");
const Mechanicmodel = require("../models/mechanic.model");
const APPLICATION_CONSTANT = require("../constant/application_constant");
const startMechanicMatching = require("../utilits/mechnicfind");
const STATUS_CODE = require("../constant/status_code");
const AppError = require("../utilits/appError");
const { getIO } = require("../utilits/socket");
const Transactionmodel = require("../models/transaction.model");
const Mastermodel = require("../models/master/master.model");
const { default: mongoose } = require("mongoose");
const { sendNotifications } = require("../utilits/firebase");
const Usermodel = require("../models/user.model");
const SendEmail = require("../utilits/email/sendEmail");

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
      expert,
    } = req.query;

    const day = new Date(date);
    const startDay = new Date(day);
    startDay.setUTCHours(0, 0, 0, 0);

    const endDay = new Date(day);
    endDay.setUTCHours(23, 59, 59, 999);

    const bookedMechanics = await Bookingsmodel.find({
      service_date: {
        $gte: startDay,
        $lte: endDay,
      },
      slot: slot,
      status: {
        $in: [
          APPLICATION_CONSTANT.PENDING,
          APPLICATION_CONSTANT.ACCEPTED,
          APPLICATION_CONSTANT.ARRIVED,
        ],
      },
    }).distinct("mechanicid");

    console.log(bookedMechanics);

    const query = {
      vehicle_type: vehicle_type,
      _id: { $nin: bookedMechanics },
      status: APPLICATION_CONSTANT.APPROVE,
    };

    // if (expert) {
    //   query.isexpert = true;
    // }

    const isLocationFilterEnabled =
      lat !== "any" && lng !== "any" && radiusKm !== "any";

    if (isLocationFilterEnabled) {
      // const parsedLat = parseFloat(lat);
      // const parsedLng = parseFloat(lng);
      // const parsedRadius = parseFloat(radiusKm) * 1000;
      // query.location = {
      //   $near: {
      //     $geometry: {
      //       type: "Point",
      //       coordinates: [parsedLng, parsedLat],
      //     },
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

    res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Booking created successfully",
      data: booking,
    });

    setImmediate(async () => {
      try {
        const mechanic = await Mechanicmodel.findById(mechanicid);
        if (mechanic && mechanic.device_token && mechanic.device_token.length) {
          const message = `You have a new service booking of amount ${payment_details?.totalamount}`;
          await sendNotifications([mechanic.device_token], {
            body: String(message),
            title: String("New Booking"),
          });
        }
        await SendEmail(mechanic.email, "NewBooking", mechanic.name, {
          amount: payment_details.totalamount,
        });
      } catch (notifError) {
        console.error("Error sending notification:", notifError);
      }
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

const respondToBooking = async (req, res, next) => {
  try {
    const mechanicId = req.user;
    const {
      bookingId,
      response,
      cancelreason,
      paymentmethod,
      noofkm = 0,
      star,
      imageurl,
    } = req.body;

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
      let perkm = await Mastermodel.find();
      if (booking.bookingtype === "emergency") {
        const perKmCharge = noofkm * (perkm[0]?.charge_per_km || 0);
        booking.payment_details.totalamount =
          booking?.payment_details?.totalamount + perKmCharge;
        booking.payment_details.dueamount =
          booking?.payment_details?.dueamount + perKmCharge;
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

      res
        .status(STATUS_CODE.SUCCESS)
        .json({ status: true, message: "Booking accepted." });

      setImmediate(async () => {
        try {
          const user = await Usermodel.findById(booking.userid);
          if (user && user.device_token && user.device_token.length) {
            const message = `You Booking is accepted`;
            await sendNotifications([user.device_token], {
              body: String(message),
              title: String("Booking Accepted"),
            });
          }
          await SendEmail(user.email, "Bookingaccepted", user.name, {
            amount: booking?.payment_details?.totalAmount,
          });
        } catch (notifError) {
          console.error("Error sending notification:", notifError);
        }
      });
    }

    if (response === "MECHANICCANCEL") {
      booking.status = APPLICATION_CONSTANT.CANCELLED;
      await booking.save();

      getIO().to(booking.userid.toString()).emit("bookingcancel", {
        bookingId,
        mechanicId,
      });

      res.status(STATUS_CODE.SUCCESS).json({
        status: true,
        message: "Booking cancelled by mechanic",
      });

      setImmediate(async () => {
        try {
          const user = await Usermodel.findById(booking.userid);
          if (user && user.device_token && user.device_token.length) {
            const message = `You Booking is Cancelled By Mechanic`;
            await sendNotifications([user.device_token], {
              body: String(message),
              title: String("Booking Cancelled"),
            });
          }
          await SendEmail(user.email, "Bookingcancelled", user.name, {});
        } catch (notifError) {
          console.error("Error sending notification:", notifError);
        }
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

      res.status(STATUS_CODE.SUCCESS).json({
        status: true,
        message: "Booking cancelled by user",
      });

      setImmediate(async () => {
        try {
          const user = await Mechanicmodel.findById(booking.mechanicid);
          if (user && user.device_token && user.device_token.length) {
            const message = `You Booking is Cancelled By User`;
            await sendNotifications([user.device_token], {
              body: String(message),
              title: String("Booking Cancelled"),
            });
          }
          await SendEmail(user.email, "Bookingcancelled", user.name, {});
        } catch (notifError) {
          console.error("Error sending notification:", notifError);
        }
      });
    }

    if (response === "BOOKINGCOMPLETED") {
      // const transactionStatus =
      //   paymentmethod === APPLICATION_CONSTANT.CASH
      //     ? APPLICATION_CONSTANT.PAID
      //     : APPLICATION_CONSTANT.PENDING;

      const transactionStatus = APPLICATION_CONSTANT.PAID;

      booking.status = APPLICATION_CONSTANT.COMPLETED;
      booking.payment_status = transactionStatus;
      booking.payment_details.dueamount = 0;
      booking.payment_details.paidamount = booking.payment_details.totalamount;
      booking.payment_type = paymentmethod;

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

      res.status(STATUS_CODE.SUCCESS).json({
        status: true,
        message: "Booking completed",
      });

      setImmediate(async () => {
        try {
          const user = await Usermodel.findById(booking.userid);
          if (user && user.device_token && user.device_token.length) {
            const message = `You Booking is Completed! Please pay through cash or online`;
            await sendNotifications([user.device_token], {
              body: String(message),
              title: String("Booking Cancelled"),
            });
          }
          await SendEmail(user.email, "Bookingcompleted", user.name, {});
        } catch (notifError) {
          console.error("Error sending notification:", notifError);
        }
      });
    }

    if (response === "Uploadscreen") {
      let payments = await Transactionmodel.findOne({ bookingId: booking._id });
      payments.paymentscreenshot = imageurl;

      await payments.save();

      return res.status(STATUS_CODE.SUCCESS).json({
        status: true,
        message: "Screenshot uploaded",
      });
    }

    if (response === "userconformed") {
      let user = await Usermodel.findById(booking.userid);
      let mechnic = await Mechanicmodel.findById(booking.mechanicid);
      let points = await Mastermodel.find();
      user.wallet_amount = user.wallet_amount + points[0].Loyality_points;
      mechnic.wallet_amount = mechnic.wallet_amount + points[0].Loyality_points;

      booking.status = APPLICATION_CONSTANT.USERCONFORM;
      await booking.save();
      await user.save();
      await mechnic.save();

      return res.status(STATUS_CODE.SUCCESS).json({
        status: true,
        message: "Loyality Points added",
      });
    }

    if (response === "Reviewbooking") {
      booking.reviewstar = star;
      await booking.save();

      const reviews = await Bookingsmodel.find({
        mechanicid: booking.mechanicid,
        reviewstar: { $gte: 1 },
      }).select("reviewstar");

      const totalReviews = reviews.length;
      const totalStars = reviews.reduce(
        (sum, r) => sum + (r.reviewstar || 0),
        0
      );
      const avgRating = totalReviews > 0 ? totalStars / totalReviews : 0;

      const mechanic = await Mechanicmodel.findById(booking.mechanicid);
      mechanic.rating = avgRating.toFixed(1);
      booking.status = APPLICATION_CONSTANT.RATINGGIVEN;
      await booking.save();
      await mechanic.save();

      return res.status(STATUS_CODE.SUCCESS).json({
        status: true,
        message: "Successfully rating added",
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
    const { status, page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$expr = {
        $regexMatch: {
          input: { $toString: "$_id" },
          regex: search + "$",
          options: "i",
        },
      };
    }

    const [bookings, total] = await Promise.all([
      Bookingsmodel.find(query)
        .skip(parseInt(skip))
        .limit(parseInt(limit))
        .sort({ createdAt: -1 })
        .populate("userid", "name email phone_number")
        .populate("mechanicid", "name phone_number"),
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

const GetAllmyEarning = async (req, res, next) => {
  try {
    // Get commission and platform fee from master settings
    const commissionData = await Mastermodel.findOne();
    const commissionPercentage = commissionData?.commision_percentage || 0;
    const platformFee = commissionData?.platform_fee || 0;

    const mechanicId = req.mechanic;
    if (!mechanicId) {
      return next(
        new AppError("Mechanic ID is missing", STATUS_CODE.BADREQUEST)
      );
    }

    const { month, year } = req.query;
    let dateFilter = {};

    if (month && year && month !== "all" && year !== "all") {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 1);
      dateFilter.transactionDate = { $gte: startDate, $lt: endDate };
    }

    const transactions = await Transactionmodel.find({
      mechnaicId: mechanicId,
      status: "paid",
      ...dateFilter,
    });

    // Totals
    let totalNetEarning = 0;
    let totalPayout = 0;
    let totalCashCommission = 0;
    let totalCashNetEarning = 0;
    let totalCommission = 0;
    let totalPlatformFee = 0;

    const earnings = [];
    const payouts = [];

    transactions.forEach((transaction) => {
      const { paymentDetails = {}, type, paymentMethod } = transaction;
      const totalAmount = paymentDetails.totalAmount || 0;
      const discount = paymentDetails.discount || 0;

      if (type === "payment") {
        const grossBeforeFee = totalAmount + discount;
        const mechanicGross = grossBeforeFee - platformFee;
        const commission = (mechanicGross * commissionPercentage) / 100;
        const netEarning = mechanicGross - commission;

        // Accumulate totals
        totalCommission += commission;
        totalPlatformFee += platformFee;
        totalNetEarning += netEarning;

        if (paymentMethod === "cash") {
          totalCashCommission += commission + platformFee;
          totalCashNetEarning += netEarning;
        }

        earnings.push({
          transactionId: transaction._id,
          bookingId: transaction.bookingId,
          transactionDate: transaction.transactionDate,
          paymentMethod,
          grossEarning: mechanicGross,
          commission,
          platformFee,
          netEarning,
          commissionPending:
            paymentMethod === "cash" ? commission + platformFee : 0,
        });
      } else if (type === "payout") {
        const payoutAmount = transaction.amount || 0;
        totalPayout += payoutAmount;

        payouts.push({
          transactionId: transaction._id,
          payoutDate: transaction.transactionDate,
          amount: payoutAmount,
        });
      }
    });

    // Final net balance:
    const netBalance =
      totalNetEarning - totalPayout - totalCashCommission - totalCashNetEarning;

    // Send response
    return res.status(200).json({
      success: true,
      mechanicId,
      month: month ? parseInt(month) : "all",
      year: year ? parseInt(year) : "all",
      totalCommission,
      totalPlatformFee,
      totalPendingCommission: totalCashCommission,
      totalCashNetEarning,
      totalNetEarning,
      totalPayout,
      netBalance,
      earnings,
      payouts,
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

const mechanicwiseEarning = async (req, res, next) => {
  try {
    const commissionData = await Mastermodel.findOne();
    const commissionPercentage = commissionData?.commision_percentage || 0;
    const platformFee = commissionData?.platform_fee || 0;

    const { month, year } = req.query;
    let dateFilter = {};

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 1);
      dateFilter.transactionDate = { $gte: startDate, $lt: endDate };
    }

    const transactions = await Transactionmodel.find({
      status: "paid",
      ...dateFilter,
    });

    const mechanicMap = new Map();

    transactions.forEach((transaction) => {
      const mechId = transaction.mechnaicId?.toString();
      if (!mechId) return;

      if (!mechanicMap.has(mechId)) {
        mechanicMap.set(mechId, []);
      }

      mechanicMap.get(mechId).push(transaction);
    });

    const mechanicEarnings = [];

    for (const [mechanicId, mechTransactions] of mechanicMap.entries()) {
      let totalNetEarning = 0;
      let totalPayout = 0;
      let totalCashCommission = 0;
      let totalCashNetEarning = 0;
      let totalCommission = 0;
      let totalPlatformFee = 0;

      const earnings = [];
      const payouts = [];

      for (const transaction of mechTransactions) {
        const { paymentDetails = {}, type, paymentMethod } = transaction;
        const totalAmount = paymentDetails.totalAmount || 0;
        const discount = paymentDetails.discount || 0;

        if (type === "payment") {
          const grossBeforeFee = totalAmount + discount;
          const mechanicGross = grossBeforeFee - platformFee;
          const commission = (mechanicGross * commissionPercentage) / 100;
          const netEarning = mechanicGross - commission;

          totalCommission += commission;
          totalPlatformFee += platformFee;
          totalNetEarning += netEarning;

          if (paymentMethod === "cash") {
            totalCashCommission += commission + platformFee;
            totalCashNetEarning += netEarning;
          }

          earnings.push({
            transactionId: transaction._id,
            bookingId: transaction.bookingId,
            transactionDate: transaction.transactionDate,
            paymentMethod,
            grossEarning: mechanicGross,
            commission,
            platformFee,
            netEarning,
            commissionPending:
              paymentMethod === "cash" ? commission + platformFee : 0,
          });
        } else if (type === "payout") {
          const payoutAmount = transaction.amount || 0;
          totalPayout += payoutAmount;

          payouts.push({
            transactionId: transaction._id,
            payoutDate: transaction.transactionDate,
            amount: payoutAmount,
          });
        }
      }

      const netBalance =
        totalNetEarning -
        totalPayout -
        totalCashCommission -
        totalCashNetEarning;

      // 🧠 Fetch mechanic details
      const mechanic = await Mechanicmodel.findById(mechanicId).select(
        "name phone_number"
      );

      mechanicEarnings.push({
        mechanicId,
        name: mechanic?.name || "Unknown",
        phone: mechanic?.phone_number || "N/A",
        month: month ? parseInt(month) : "all",
        year: year ? parseInt(year) : "all",
        totalCommission,
        totalPlatformFee,
        totalPendingCommission: totalCashCommission,
        totalCashNetEarning,
        totalNetEarning,
        totalPayout,
        netBalance,
        earnings,
        payouts,
      });
    }

    return res.status(200).json({
      success: true,
      count: mechanicEarnings.length,
      data: mechanicEarnings,
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

const Paypayout = async (req, res, next) => {
  try {
    let { mechanicid, transaction_id, amount, paymentmethod } = req.body;

    // Generate random ObjectIds for bookingId and userId
    const bookingId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();

    let createpayout = await Transactionmodel.create({
      bookingId,
      userId,
      mechnaicId: mechanicid,
      amount: amount,
      paymentMethod: paymentmethod,
      status: "paid",
      transactionId: transaction_id,
      paymentDetails: {
        totalAmount: 0,
        discount: 0,
        paidAmount: 0,
        dueAmount: 0,
        method: paymentmethod,
      },
      type: "payout",
    });

    res.status(200).json({
      status: true,
      code: 200,
      data: createpayout,
    });

    setImmediate(async () => {
      try {
        const user = await Mechanicmodel.findById(mechanicid);
        if (user && user.device_token && user.device_token.length) {
          const message = `Your Payout has been released`;
          await sendNotifications([user.device_token], {
            body: String(message),
            title: String("Payout released"),
          });
        }
        await SendEmail(user.email, "Payout", user.name, {
          description: `Your Payout has been released`,
          amount: amount,
          transactionid: transaction_id,
        });
      } catch (notifError) {
        console.error("Error sending notification:", notifError);
      }
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

const GetAllpayments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    const query = {
      type:"payment"
    };

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$expr = {
        $regexMatch: {
          input: { $toString: "$_id" },
          regex: search + "$",
          options: "i",
        },
      };
    }

    const [bookings, total] = await Promise.all([
      Transactionmodel.find(query)
        .skip(parseInt(skip))
        .limit(parseInt(limit))
        .sort({ createdAt: -1 })
        .populate("userId", "name email phone_number")
        .populate("mechnaicId", "name phone_number"),
      Transactionmodel.countDocuments(query),
    ]);

    res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Payments fetched",
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: bookings,
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

const getLast7DaysStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const last7Days = new Date(today);
    last7Days.setDate(today.getDate() - 6);

    // ✅ Aggregate data for total stats
    const [totalStats] = await Bookingsmodel.aggregate([
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalEarnings: { $sum: "$payment_details.totalamount" },
        },
      },
    ]);

    // ✅ Today's stats
    const [todayStats] = await Bookingsmodel.aggregate([
      {
        $match: {
          createdAt: { $gte: today, $lt: tomorrow },
        },
      },
      {
        $group: {
          _id: null,
          todayBookings: { $sum: 1 },
          todayEarnings: { $sum: "$payment_details.totalamount" },
        },
      },
    ]);

    // ✅ Yesterday's stats
    const [yesterdayStats] = await Bookingsmodel.aggregate([
      {
        $match: {
          createdAt: { $gte: yesterday, $lt: today },
        },
      },
      {
        $group: {
          _id: null,
          yesterdayBookings: { $sum: 1 },
          yesterdayEarnings: { $sum: "$payment_details.totalamount" },
        },
      },
    ]);

    // ✅ Last 7 days for charts (use %Y-%m-%d instead of %a)
    const last7DaysStats = await Bookingsmodel.aggregate([
      {
        $match: {
          createdAt: { $gte: last7Days, $lte: tomorrow },
        },
      },
      {
        $group: {
          _id: { date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } },
          bookings: { $sum: 1 },
          earnings: { $sum: "$payment_details.totalamount" },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]);

    // ✅ Convert MongoDB date string to weekday (Mon, Tue, etc.)
    const chartData = last7DaysStats.map((item) => {
      const date = new Date(item._id.date);
      const day = date.toLocaleString("en-US", { weekday: "short" }); // Mon, Tue, etc.
      return {
        day,
        bookings: item.bookings,
        earnings: item.earnings,
      };
    });

    // ✅ Extract values
    const totalBookings = totalStats?.totalBookings || 0;
    const totalEarnings = totalStats?.totalEarnings || 0;
    const todayBookings = todayStats?.todayBookings || 0;
    const todayEarnings = todayStats?.todayEarnings || 0;
    const yesterdayBookings = yesterdayStats?.yesterdayBookings || 0;
    const yesterdayEarnings = yesterdayStats?.yesterdayEarnings || 0;

    // ✅ Calculate % Change and Trend
    const calculateChange = (todayVal, yesterdayVal) => {
      if (yesterdayVal === 0 && todayVal > 0) return { change: "+100%", trend: "up" };
      if (yesterdayVal === 0 && todayVal === 0) return { change: "0%", trend: "neutral" };
      const diff = ((todayVal - yesterdayVal) / yesterdayVal) * 100;
      return {
        change: `${diff > 0 ? "+" : ""}${diff.toFixed(2)}%`,
        trend: diff >= 0 ? "up" : "down",
      };
    };

    const bookingChange = calculateChange(todayBookings, yesterdayBookings);
    const earningChange = calculateChange(todayEarnings, yesterdayEarnings);

    // ✅ Stats Data
    const stats = [
      {
        title: "Total Bookings",
        value: totalBookings.toLocaleString(),
        change: "N/A",
        trend: "neutral",
        icon: "Calendar",
        color: "text-success",
      },
      {
        title: "Total Earnings",
        value: `₹${totalEarnings.toLocaleString()}`,
        change: "N/A",
        trend: "neutral",
        icon: "IndianRupee",
        color: "text-info",
      },
      {
        title: "Today Booking",
        value: todayBookings.toLocaleString(),
        change: bookingChange.change,
        trend: bookingChange.trend,
        icon: "DollarSign",
        color: bookingChange.trend === "up" ? "text-success" : "text-danger",
      },
      {
        title: "Today Earning",
        value: `₹${todayEarnings.toLocaleString()}`,
        change: earningChange.change,
        trend: earningChange.trend,
        icon: "DollarSign",
        color: earningChange.trend === "up" ? "text-success" : "text-danger",
      },
    ];

    res.status(200).json({
      status: true,
      message: "Dashboard data fetched successfully",
      stats,
      charts: {
        bookingData: chartData,
        earningsData: chartData.map(({ day, earnings }) => ({ day, amount: earnings })),
      },
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
  GetAllmyEarning,
  mechanicwiseEarning,
  Paypayout,
  GetAllpayments,
  getLast7DaysStats
};
