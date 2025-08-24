const express = require("express");
const { Isadmin } = require("../middleware/Isadmin");
const {
  CreateNotification,
  GetAllNotifications,
  DeleteNotification,
} = require("../controllers/notification.controller");

const notificationRouter = express.Router();

// Notification routes
notificationRouter.post("/create", Isadmin, CreateNotification);
notificationRouter.get("/getall", GetAllNotifications);
notificationRouter.delete("/delete/:id", Isadmin, DeleteNotification);

module.exports = notificationRouter;
