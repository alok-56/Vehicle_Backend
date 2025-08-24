const express = require("express");
const {
  CreateUser,
  VerifyUser,
  GetOwnprofile,
  GetallUser,
  blockuser,
  DeleteUser,
  UpdateProfile,
} = require("../controllers/user.controller");
const { Isuser } = require("../middleware/Isuser");
const { Isadmin } = require("../middleware/Isadmin");
const userRouter = express.Router();

userRouter.post("/create", CreateUser);
userRouter.post("/verify", VerifyUser);
userRouter.get("/ownprofile", Isuser, GetOwnprofile);
userRouter.get("/allusers", Isadmin, GetallUser);
userRouter.patch("/blockuser/:id", Isadmin, blockuser);
userRouter.delete("/deleteuser/:id", Isadmin, DeleteUser);
userRouter.patch("/updateprofile", Isuser, UpdateProfile);

module.exports = userRouter;
