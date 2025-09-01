const mongoose = require("mongoose");

const Masterschema = new mongoose.Schema(
  {
    charge_per_km: {
      type: Number,
      default: 0,
    },
    platform_fee: {
      type: Number,
      default: 0,
    },
    commision_percentage: {
      type: Number,
      default: 0,
    },
    mechanic_charge: {
      type: Number,
      default: 0,
    },
    referral_bonus: {
      type: Number,
      default: 0,
    },
    Loyality_points: {
      type: Number,
      default: 0,
    },
    discount_percentage: {
      type: Number,
      default: 0,
    },
    upi_number: {
      type: String,
    },
  },
  { timestamps: true }
);

const Mastermodel = mongoose.model("master", Masterschema);
module.exports = Mastermodel;
