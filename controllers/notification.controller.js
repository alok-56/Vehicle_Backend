const STATUS_CODE = require("../constant/status_code");
const AppError = require("../utilits/appError");
const NotificationModel = require("../models/notification.model");
const Mechanicmodel = require("../models/mechanic.model");
const { sendNotifications } = require("../utilits/firebase");
const Usermodel = require("../models/user.model");

// create notification
const CreateNotification = async (req, res, next) => {
  try {
    const { message, type, user_id, mechanicid } = req.body;

    // Check if message is provided
    if (!message) {
      return next(
        new AppError("Message is required", STATUS_CODE.VALIDATIONERROR)
      );
    }

    let deviceTokens = [];

    // Determine the recipient(s) based on type
    if (type === "mechanic") {
      if (!mechanicid) {
        return next(
          new AppError(
            "Mechanic ID is required for mechanic notifications",
            STATUS_CODE.VALIDATIONERROR
          )
        );
      }
      const mechanic = await Mechanicmodel.findById(mechanicid);
      if (mechanic && mechanic.device_token) {
        deviceTokens = [mechanic.device_token]; // Add mechanic token
      }
    } else if (type === "user") {
      if (!user_id) {
        return next(
          new AppError(
            "User ID is required for user notifications",
            STATUS_CODE.VALIDATIONERROR
          )
        );
      }
      const user = await Usermodel.findById(user_id);
      if (user && user.device_token) {
        deviceTokens = [user.device_token]; // Add user token
      }
    } else if (type === "all") {
      // Fetch all mechanics with valid tokens
      const mechanics = await Mechanicmodel.find({
        device_token: { $exists: true, $ne: null },
      });
      const mechanicTokens = mechanics
        .map((m) => m.device_token)
        .filter(Boolean);

      // Fetch all users with valid tokens
      const users = await Usermodel.find({
        device_token: { $exists: true, $ne: null },
      });
      const userTokens = users.map((u) => u.device_token).filter(Boolean);

      // Combine all tokens
      deviceTokens = [...mechanicTokens, ...userTokens];
    } else {
      return next(
        new AppError("Invalid notification type", STATUS_CODE.VALIDATIONERROR)
      );
    }

    // Remove duplicate tokens from the array
    deviceTokens = [...new Set(deviceTokens)];

    // If there are valid device tokens, send the notifications
    if (deviceTokens.length > 0) {
      const formattedData = {
        body: String(message),
        title: String("New Notification"),
      };

      // Send notifications
      await sendNotifications(deviceTokens, formattedData);

      // Save the notification to the database
    }

    const notification = new NotificationModel({
      message,
      type,
      device_token: deviceTokens,
    });

    await notification.save();

    return res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Notification created and sent successfully",
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
    const [notifications] = await NotificationModel.find({
      device_token: { $in: token },
      type: "all",
    })
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
