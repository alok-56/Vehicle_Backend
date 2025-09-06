const express = require("express");
const { Isadmin } = require("../middleware/Isadmin");
const {
  CreateSlot,
  GetAllSlots,
  DeleteSlot,
  EdidtSlot,
} = require("../controllers/slot.controller");

const slotRouter = express.Router();

// Slot routes
slotRouter.post("/create", Isadmin, CreateSlot);
slotRouter.patch("/update/:id", Isadmin, EdidtSlot);
slotRouter.get("/getall", GetAllSlots);
slotRouter.delete("/delete/:id", Isadmin, DeleteSlot);

module.exports = slotRouter;
