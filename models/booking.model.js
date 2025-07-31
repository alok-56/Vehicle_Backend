const mongoose = require("mongoose");
const APPLICATION_CONSTANT = require("../constant/application_constant");

const Bookingschema = new mongoose.Schema(
  {
    userid: {
      type: String,
      required: true,
    },
    userLocation: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: [Number],
    },
    problem: {
      type: String,
      required: true,
    },
    mechanicid: { type: mongoose.Types.ObjectId, ref: "mechanic" },
    bookingtype: {
      type: String,
      required: true,
      enum: ["emergency", "services"],
    },
    service_date: Date,
    service_start_time: String,
    service_end_time: String,
    services: [
      {
        servicename: String,
        price: Number,
        remarks: String,
      },
    ],
    additional_services: [
      {
        servicename: String,
        price: Number,
        remarks: String,
      },
    ],
    triedMechanicIds: [{ type: mongoose.Types.ObjectId, ref: "mechanic" }],
    status: {
      type: String,
      required: true,
      enum: [
        APPLICATION_CONSTANT.PENDING,
        APPLICATION_CONSTANT.ACCEPTED,
        APPLICATION_CONSTANT.ARRIVED,
        APPLICATION_CONSTANT.COMPLETED,
        APPLICATION_CONSTANT.CANCELLED,
      ],
      default: APPLICATION_CONSTANT.PENDING,
    },
    cancelled_remarks: {
      type: String,
    },
    payment_status: {
      type: String,
      enum: [
        APPLICATION_CONSTANT.PENDING,
        APPLICATION_CONSTANT.PAID,
        APPLICATION_CONSTANT.FAILED,
      ],
      default: APPLICATION_CONSTANT.PENDING,
    },
    payment_emerg_summary: {
      platform_fee: Number,
      price_per_km: Number,
      mechanic_charge: Number,
      additional_service_cost: Number,
    },
    payment_ser_summary: {
      platform_fee: Number,
      mechanic_charge: Number,
      service_cost: Number,
    },
    payment_details: {
      totalamount: Number,
      paidamount: Number,
      dueamount: Number,
    },
    payment_type: {
      type: String,
      enum: [APPLICATION_CONSTANT.CASH, APPLICATION_CONSTANT.ONLINE],
    },
    userSocketId: String,
    mechanicSocketId: String,
  },
  { timestamps: true }
);

const Bookingsmodel = mongoose.model("booking", Bookingschema);
module.exports = Bookingsmodel;
