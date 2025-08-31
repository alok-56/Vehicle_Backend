const mongoose = require("mongoose");

const LoyalityPaySchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
    usertype: {
      type: String,
      required: true,
      enum: ["user", "mechnaic"],
    },
    transaction_id: {
      type: String,
    },
    userid: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Loyalitypaymodel = mongoose.model("Loyalitypay", LoyalityPaySchema);
module.exports = Loyalitypaymodel;
