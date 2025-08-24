const express = require("express");

const { Isadmin } = require("../middleware/Isadmin");
const {
  createMaster,
  updateMaster,
  getMaster,
  createVehCompany,
  updateVehCompany,
  getAllVehCompanies,
  deleteVehCompany,
} = require("../controllers/master.controller");

const masterRouter = express.Router();

//global master routes
masterRouter.post("/global/create", Isadmin, createMaster);
masterRouter.patch("/global/update/:id", Isadmin, updateMaster);
masterRouter.get("/globalget", getMaster);

// comapny routes
masterRouter.post("/global/company/create", Isadmin, createVehCompany);
masterRouter.patch("/global/company/update/:id", Isadmin, updateVehCompany);
masterRouter.get("/global/company/get", getAllVehCompanies);
masterRouter.delete("/global/company/delete/:id", Isadmin, deleteVehCompany);

module.exports = masterRouter;
