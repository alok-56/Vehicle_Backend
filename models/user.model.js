const mongoose = require("mongoose");
const APPLICATION_CONSTANT = require("../constant/application_constant");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone_number: {
      type: Number,
      required: true,
    },
    referral_code: {
      type: Number,
      required: true,
    },
    vehicle_type: [
      {
        type: String,
        required: true,
        enum: [
          APPLICATION_CONSTANT.CAR,
          APPLICATION_CONSTANT.BIKE,
          APPLICATION_CONSTANT.BUS,
          APPLICATION_CONSTANT.AUTO,
          APPLICATION_CONSTANT.TRUCK,
        ],
      },
    ],
    vehicle_model: {
      type: String,
      required: false,
    },
    wallet_amount: {
      type: Number,
      default: 0,
    },
    isBlocked: {
      type: Boolean,
      required: true,
      default: false,
    },
    device_token: {
      type: String,
    },
    profilepicture: {
      type: String,
    },
    socketId: { type: String, default: null },
  },
  { timestamps: true }
);

const Usermodel = mongoose.model("user", UserSchema);
module.exports = Usermodel;
