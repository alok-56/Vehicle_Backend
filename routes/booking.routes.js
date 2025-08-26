const express = require("express");
const { Isuser } = require("../middleware/Isuser");
const { Isadmin } = require("../middleware/Isadmin");
const {
  createEmergencyBooking,
  respondToBooking,
  createserviceBooking,
  Addaditionalservice,
  GetUserbooking,
  GetMechnicbooking,
  GetAllbooking,
  Findservicesmechnic,
  GetUserPayments,
  GetUseractivebooking,
  GetMechnicactivebooking,
  GetAllmyEarning,
  mechanicwiseEarning,
  Paypayout,
} = require("../controllers/booking.controller");
const { Isuserormechanic } = require("../middleware/Isuserormechanic");
const { Ismechanic } = require("../middleware/Ismechanic");
const bookingRouter = express.Router();

bookingRouter.post("/emergency/create", Isuser, createEmergencyBooking);
bookingRouter.get("/user/services/mechnaic", Isuser, Findservicesmechnic);
bookingRouter.patch("/update/status", Isuserormechanic, respondToBooking);
bookingRouter.post("/services/create", Isuser, createserviceBooking);
bookingRouter.patch(
  "/additionalservice/add/:id",
  Ismechanic,
  Addaditionalservice
);
bookingRouter.get("/user/mybooking", Isuser, GetUserbooking);
bookingRouter.get("/mechnaic/mybooking", Ismechanic, GetMechnicbooking);
bookingRouter.get("/admin/booking", Isadmin, GetAllbooking);
bookingRouter.get("/user/payment", Isuser, GetUserPayments);
bookingRouter.get("/active/user/booking", Isuser, GetUseractivebooking);
bookingRouter.get(
  "/active/mechnaic/booking",
  Ismechanic,
  GetMechnicactivebooking
);
bookingRouter.get("/earning", Ismechanic, GetAllmyEarning);
bookingRouter.get("/earning/mechanic", Isadmin, mechanicwiseEarning);
bookingRouter.post("/create/apyout", Isadmin, Paypayout);

module.exports = bookingRouter;
