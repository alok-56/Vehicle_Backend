const express = require("express");
const { CreateUser, VerifyUser } = require("../controllers/user.controller");
const userRouter = express.Router();

userRouter.post("/create", CreateUser);
userRouter.post("/verify", VerifyUser);


module.exports=userRouter