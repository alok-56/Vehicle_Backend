const mongoose = require("mongoose");
const APPLICATION_CONSTANT = require("../../constant/application_constant");

const Sosseviceschema = new mongoose.Schema(
  {
    servicename: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    vehicle_type: {
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
    price: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const SosServicemodel = mongoose.model("sosservice", Sosseviceschema);
module.exports = {
  SosServicemodel,
};
