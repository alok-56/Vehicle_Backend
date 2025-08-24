const mongoose = require("mongoose");

const Slotschma = new mongoose.Schema(
  {
    no_of_hour: {
      type: String,
      required: true,
    },
    starttime: {
      type: String,
      required: true,
    },
    endtime: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Slotmodel = mongoose.model("slot", Slotschma);
module.exports = Slotmodel;
