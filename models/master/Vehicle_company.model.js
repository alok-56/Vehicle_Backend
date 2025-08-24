const mongoose = require("mongoose");

const VehcompanySchema = new mongoose.Schema(
  {
    companyname: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
  },
  { timestamps: true }
);

const Vehcompanymodel = mongoose.model("vehiclecompany", VehcompanySchema);
module.exports = {
  Vehcompanymodel,
};
