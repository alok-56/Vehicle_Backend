const mongoose = require("mongoose");
const APPLICATION_CONSTANT = require("../constant/application_constant");

const MechanicSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone_number: { type: Number, required: true },
    isemailverified: { type: Boolean, default: false },
    isPhoneverified: { type: Boolean, default: false },
    referral_code: { type: Number, required: true },
    socketId: { type: String, default: null },
    isAvailable: { type: Boolean, default: false },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
        required: true,
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
        required: true,
      },
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
    documents: {
      adhar_card: { type: String },
      profile_photo: { type: String },
      shop_photo: { type: String },
    },
    shop_details: {
      shop_name: { type: String },
      lat: { type: Number },
      long: { type: Number },
      experience: { type: Number },
      description: { type: String },
      perHourPrice: { type: Number },
    },
    payment_details: {
      account_holder_name: { type: String },
      account_number: { type: String },
      ifsc_code: { type: String },
      bank_name: { type: String },
      upi_id: { type: String },
      preferred_method: {
        type: String,
        enum: ["BANK", "UPI"],
      },
    },
    isBlocked: { type: Boolean, default: false },
    remarks: {
      type: String,
    },
    status: {
      type: String,
      enum: [
        APPLICATION_CONSTANT.PENDING,
        APPLICATION_CONSTANT.SENDFORVERIFICATION,
        APPLICATION_CONSTANT.RESENDFORVERIFICATION,
        APPLICATION_CONSTANT.APPROVE,
        APPLICATION_CONSTANT.REJECTED,
      ],
      default: APPLICATION_CONSTANT.PENDING,
    },
    rating: {
      type: Number,
    },
    device_token: {
      type: String,
    },
  },
  { timestamps: true }
);

const Mechanicmodel = mongoose.model("mechanic", MechanicSchema);
module.exports = Mechanicmodel;
