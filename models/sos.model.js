const mongoose = require("mongoose");

const SosSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    mechanicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "mechanic",
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    status: {
      type: String,
      enum: ["active", "resolved"],
      default: "active",
    },
  },
  { timestamps: true }
);

SosSchema.index({ location: "2dsphere" });

const SosModel = mongoose.model("sos", SosSchema);

module.exports = SosModel;
