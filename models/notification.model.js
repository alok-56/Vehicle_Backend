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
    token: {
      type: [],
    },
  },
  { timestamps: true }
);

NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const notificationmodel = mongoose.model("Notification", NotificationSchema);
module.exports = notificationmodel;
