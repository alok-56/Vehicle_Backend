const STATUS_CODE = require("../constant/status_code");
const AppError = require("../utilits/appError");
const NotificationModel = require("../models/notification.model");
const Mechanicmodel = require("../models/mechanic.model");
const { sendNotifications } = require("../utilits/firebase");
const Usermodel = require("../models/user.model");
const { default: mongoose } = require("mongoose");

const CreateNotification = async (req, res, next) => {
  try {
    console.log("🔥 Incoming CreateNotification Request Body:", req.body);
    const { message, type, user_id, mechanicid } = req.body;

    // Validate message
    if (!message) {
      return next(
        new AppError("Message is required", STATUS_CODE.VALIDATIONERROR)
      );
    }

    let deviceTokens = [];

  

    if (type === "mechanic") {
      if (!mechanicid) {
        return next(
          new AppError("Mechanic ID is required", STATUS_CODE.VALIDATIONERROR)
        );
      }
      const mechanic = await Mechanicmodel.findById(mechanicid);
      if (mechanic && mechanic.device_token) {
        deviceTokens.push(mechanic.device_token);
      }
    } else if (type === "user") {
      if (!user_id) {
        return next(
          new AppError("User ID is required", STATUS_CODE.VALIDATIONERROR)
        );
      }
      const user = await Usermodel.findById(user_id);
      if (user && user.device_token) {
        deviceTokens.push(user.device_token);
      }
    } else if (type === "all") {
      console.log("➡ Sending notification to ALL users & mechanics");
      const mechanics = await Mechanicmodel.find({
        device_token: { $exists: true, $ne: null },
      });
      const users = await Usermodel.find({
        device_token: { $exists: true, $ne: null },
      });

      const mechanicTokens = mechanics
        .map((m) => m.device_token)
        .filter(Boolean);
      const userTokens = users.map((u) => u.device_token).filter(Boolean);

      deviceTokens = [...mechanicTokens, ...userTokens];
    } else {
      return next(
        new AppError("Invalid notification type", STATUS_CODE.VALIDATIONERROR)
      );
    }

    deviceTokens = [...new Set(deviceTokens)]; 


    const notification = new NotificationModel({
      message,
      type,
      device_token: type === "all" ? [] : deviceTokens,
    });

    await notification.save();

    res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Notification created and sent successfully",
      data: notification,
    });

    setImmediate(async () => {
      if (deviceTokens.length > 0) {
        const payload = {
          title: "New Notification",
          body: message,
        };
        await sendNotifications(deviceTokens, payload); 
      } else {
        console.log("⚠ No device tokens available for sending notification.");
      }
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};
// get all notifications
const GetAllNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      NotificationModel.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      NotificationModel.countDocuments(),
    ]);

    return res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Notifications fetched successfully",
      currentPage: page,
      totalNotifications: total,
      totalPages: Math.ceil(total / limit),
      data: notifications,
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

// delete notification
const DeleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return next(
        new AppError("Notification id is required", STATUS_CODE.VALIDATIONERROR)
      );
    }

    const deleted = await NotificationModel.findByIdAndDelete(id);
    if (!deleted) {
      return next(new AppError("Notification not found", STATUS_CODE.NOTFOUND));
    }

    return res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

// Get MyNotification
const GetMyNotification = async (req, res, next) => {
  try {
    let { token } = req.body;
    let { type = "all" } = req.query;

    // Build query dynamically
    let query = {};

    if (type !== "all") {
      query.type = type;
      if (token) {
        query.device_token = { $in: token };
      }
    }

    const notifications = await NotificationModel.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Notifications fetched successfully",
      data: notifications,
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

module.exports = {
  CreateNotification,
  GetAllNotifications,
  DeleteNotification,
  GetMyNotification,
};
