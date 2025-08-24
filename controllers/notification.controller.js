const STATUS_CODE = require("../constant/status_code");
const AppError = require("../utilits/appError");
const NotificationModel = require("../models/notification.model");

// create notification
const CreateNotification = async (req, res, next) => {
  try {
    const { message, type } = req.body;

    if (!message) {
      return next(new AppError("Message is required", STATUS_CODE.VALIDATIONERROR));
    }

    const notification = await NotificationModel.create({ message, type });

    return res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Notification created successfully",
      data: notification,
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
      NotificationModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
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
      return next(new AppError("Notification id is required", STATUS_CODE.VALIDATIONERROR));
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

module.exports = {
  CreateNotification,
  GetAllNotifications,
  DeleteNotification,
};
