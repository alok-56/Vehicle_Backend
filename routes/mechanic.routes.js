const express = require("express");
const {
  CreateMechanic,
  VerifyMechanic,
  Mechanicowndata,
  Sendforverification,
  GetallMechanic,
  blockMechanic,
  DeleteMechanic,
  Checkapplication,
  GetMechOwnprofile,
  UpdateMechanicProfile,
  UpdatemechanicLocation,
  GetmechanicLocation,
} = require("../controllers/mechanic.controller");
const { Ismechanic } = require("../middleware/Ismechanic");
const { Isadmin } = require("../middleware/Isadmin");
const { Isuser } = require("../middleware/Isuser");

const mechanicRouter = express.Router();

mechanicRouter.post("/create", CreateMechanic);
mechanicRouter.post("/verify", VerifyMechanic);
mechanicRouter.get("/owndata", Ismechanic, Mechanicowndata);
mechanicRouter.patch("/sendforverification", Ismechanic, Sendforverification);
mechanicRouter.get("/allmechnic", Isadmin, GetallMechanic);
mechanicRouter.get("/user/allmechnic", Isuser, GetallMechanic);
mechanicRouter.patch("/checkapplication", Isadmin, Checkapplication);
mechanicRouter.patch("/blockmechnic/:id", Isadmin, blockMechanic);
mechanicRouter.delete("/deletemechnic/:id", Isadmin, DeleteMechanic);
mechanicRouter.get("/ownprofile", Ismechanic, GetMechOwnprofile);
mechanicRouter.patch("/update", Ismechanic, UpdateMechanicProfile);
mechanicRouter.patch("/update/location", Ismechanic, UpdatemechanicLocation);
mechanicRouter.patch("/get/location", Ismechanic, GetmechanicLocation);

module.exports = mechanicRouter;
