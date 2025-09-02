const mongoose = require("mongoose");

const Locationschma = new mongoose.Schema(
  {
    lat: {
      type: String,
      required: true,
    },
    long: {
      type: String,
      required: true,
    },
    mechanicid: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Locationmodel = mongoose.model("Location", Locationschma);
module.exports = Locationmodel;
