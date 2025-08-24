const express = require("express");
const { Isadmin } = require("../middleware/Isadmin");
const {
  CreateService,
  Updateservice,
  GetAllServices,
  DeleteService,
  CreateServicePart,
  UpdateServicePart,
  GetPartsByServiceId,
  DeleteServicePart,
  CreateSosservice,
  UpdateSosservice,
  GetAllSosServices,
  DeleteSosService,
} = require("../controllers/service.controller");

const serviceRouter = express.Router();

// Services
serviceRouter.post("/create", Isadmin, CreateService);
serviceRouter.patch("/update", Isadmin, Updateservice);
serviceRouter.get("/getall", GetAllServices);
serviceRouter.delete("/delete/:id", Isadmin, DeleteService);

// Parts
serviceRouter.post("/parts/create", Isadmin, CreateServicePart);
serviceRouter.patch("/parts/update", Isadmin, UpdateServicePart);
serviceRouter.get("/getall/parts/:serviceId", GetPartsByServiceId);
serviceRouter.delete("/parts/delete/:id", Isadmin, DeleteServicePart);

// Sos Services
serviceRouter.post("/sos/create", Isadmin, CreateSosservice);
serviceRouter.patch("/sos/update", Isadmin, UpdateSosservice);
serviceRouter.get("/sos/getall", GetAllSosServices);
serviceRouter.delete("/sos/delete/:id", Isadmin, DeleteSosService);

module.exports = serviceRouter;
