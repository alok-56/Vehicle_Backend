const mongoose = require("mongoose");
const APPLICATION_CONSTANT = require("../constant/application_constant");

const Transactionschema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "booking",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    mechnaicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "mechanic",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: [APPLICATION_CONSTANT.CASH, APPLICATION_CONSTANT.ONLINE],
      required: true,
    },
    status: {
      type: String,
      enum: [
        APPLICATION_CONSTANT.PENDING,
        APPLICATION_CONSTANT.PAID,
        APPLICATION_CONSTANT.FAILED,
      ],
      default: APPLICATION_CONSTANT.PENDING,
    },
    transactionDate: {
      type: Date,
      default: Date.now,
    },
    transactionId: {
      type: String,
      required: false,
    },
    paymentDetails: {
      type: Object,
      required: true,
    },
    type: {
      type: String,
      default: "payment",
      enum: ["payment", "payout"],
    },
  },
  { timestamps: true }
);

const Transactionmodel = mongoose.model("transaction", Transactionschema);
module.exports = Transactionmodel;
