const mongoose = require("mongoose");

const Serviceschema = new mongoose.Schema(
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
  },
  { timestamps: true }
);

const Servicemodel = mongoose.model("service", Serviceschema);
module.exports = {
  Servicemodel,
};
