const express = require("express");
const {
  CreateAdmin,
  Adminlogin,
  GetAdminownprofile,
} = require("../controllers/admin.controller");
const { GetOwnprofile } = require("../controllers/user.controller");
const { Isadmin } = require("../middleware/Isadmin");
const { PayLoyalityAmount } = require("../controllers/referrals.controller");

const adminRouter = express.Router();

adminRouter.post("/create", CreateAdmin);
adminRouter.post("/login", Adminlogin);
adminRouter.get("/ownprofile", Isadmin, GetAdminownprofile);

// Loyaloty points
adminRouter.post("/pay/loyality", Isadmin, PayLoyalityAmount);

module.exports = adminRouter;
