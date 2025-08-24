const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["system", "booking", "payment", "alert"],
      default: "system",
    },
  },
  { timestamps: true }
);

const notificationmodel = mongoose.model("Notification", NotificationSchema);
module.exports = notificationmodel;
