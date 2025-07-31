const mongoose = require("mongoose");

const Referralschma = new mongoose.Schema(
  {
    refer_code: {
      type: Number,
      required: true,
    },
    userid: {
      type: String,
      required: true,
    },
    earning: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Referralmodel = mongoose.model("refferal", Referralschma);
module.exports = Referralmodel;
