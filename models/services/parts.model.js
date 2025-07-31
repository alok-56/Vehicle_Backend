const mongoose = require("mongoose");

const Partschema = new mongoose.Schema(
  {
    serviceId: {
      type: String,
      required: true,
    },
    partname: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    image: {
      type: String,
    },
  },
  { timestamps: true }
);

const Partsmodel = mongoose.model("parts", Partschema);
module.exports = Partsmodel;
