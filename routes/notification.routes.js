const express = require("express");
const { Isadmin } = require("../middleware/Isadmin");
const {
  CreateNotification,
  GetAllNotifications,
  DeleteNotification,
  GetMyNotification,
} = require("../controllers/notification.controller");
const { Isuserormechanic } = require("../middleware/Isuserormechanic");

const notificationRouter = express.Router();

// Notification routes
notificationRouter.post("/create", Isadmin, CreateNotification);
notificationRouter.get("/getall", GetAllNotifications);
notificationRouter.delete("/delete/:id", Isadmin, DeleteNotification);
notificationRouter.post(
  "/get/mynotification",
  Isuserormechanic,
  GetMyNotification
);

module.exports = notificationRouter;
