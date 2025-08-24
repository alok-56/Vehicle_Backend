const express = require("express");
const { Isadmin } = require("../middleware/Isadmin");
const {
  CreateSlot,
  GetAllSlots,
  DeleteSlot,
} = require("../controllers/slot.controller");

const slotRouter = express.Router();

// Slot routes
slotRouter.post("/create", Isadmin, CreateSlot);        
slotRouter.get("/getall", GetAllSlots);                 
slotRouter.delete("/delete/:id", Isadmin, DeleteSlot);  

module.exports = slotRouter;
