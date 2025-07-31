const mongoose = require("mongoose");

const Masterschema = new mongoose.Schema(
  {
    charge_per_km: {
      type: Number,
    },
    platform_fee: {
      type: Number,
    },
    commision_percentage: {
      type: Number,
    },
  },
  { timestamps: true }
);

const Mastermodel = mongoose.model("master", Masterschema);
module.exports = Mastermodel;
