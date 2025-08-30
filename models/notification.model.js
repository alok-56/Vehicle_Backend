const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
    },
    device_token: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const notificationmodel = mongoose.model("Notification", NotificationSchema);
module.exports = notificationmodel;
