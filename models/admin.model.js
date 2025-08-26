const mongoose = require("mongoose");

const Adminschma = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    new:{
      type:Number,
      required:false,
      unique:false
    }
  },
  { timestamps: true }
);

const Adminmodel = mongoose.model("admin", Adminschma);
module.exports = Adminmodel;
