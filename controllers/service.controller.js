const APPLICATION_CONSTANT = require("../constant/application_constant");
const STATUS_CODE = require("../constant/status_code");
const Partsmodel = require("../models/services/parts.model");
const { Servicemodel } = require("../models/services/service.model");
const { SosServicemodel } = require("../models/services/sos.service.model");
const AppError = require("../utilits/appError");

// create service
const CreateService = async (req, res, next) => {
  try {
    let { servicename, image, vehicle_type } = req.body;
    if (
      ![
        APPLICATION_CONSTANT.CAR,
        APPLICATION_CONSTANT.BIKE,
        APPLICATION_CONSTANT.BUS,
        APPLICATION_CONSTANT.AUTO,
        APPLICATION_CONSTANT.TRUCK,
      ].includes(vehicle_type)
    ) {
      return next(
        new AppError("vechile type not matched", STATUS_CODE.VALIDATIONERROR)
      );
    }

    let service = await Servicemodel.create(req.body);

    return res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "service created successfully",
      data: service,
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

// update service
const Updateservice = async (req, res, next) => {
  try {
    let { servicename, image, vehicle_type, id } = req.body;
    if (vehicle_type) {
      if (
        ![
          APPLICATION_CONSTANT.CAR,
          APPLICATION_CONSTANT.BIKE,
          APPLICATION_CONSTANT.BUS,
          APPLICATION_CONSTANT.AUTO,
          APPLICATION_CONSTANT.TRUCK,
        ].includes(vehicle_type)
      ) {
        return next(
          new AppError("vechile type not matched", STATUS_CODE.VALIDATIONERROR)
        );
      }
    }

    const update = {};
    if (servicename) update.servicename = servicename;
    if (image) update.image = image;
    if (vehicle_type) update.vehicle_type;

    let service = await Servicemodel.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    return res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "service Updated successfully",
      data: service,
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

// get service
const GetAllServices = async (req, res, next) => {
  try {
    const services = await Servicemodel.find().lean();
    return res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Services fetched successfully",
      data: services,
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

// delete service
const DeleteService = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Servicemodel.findByIdAndDelete(id);
    return res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Service deleted successfully",
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

// create service parts

const CreateServicePart = async (req, res, next) => {
  try {
    const { serviceId, partname, amount, image } = req.body;

    if (!serviceId || !partname || !amount) {
      return next(
        new AppError("Missing required fields", STATUS_CODE.VALIDATIONERROR)
      );
    }

    const part = await Partsmodel.create({
      serviceId,
      partname,
      amount,
      image,
    });

    return res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Part created successfully",
      data: part,
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

// update service parts

const UpdateServicePart = async (req, res, next) => {
  try {
    const { id, partname, amount, serviceId, image } = req.body;

    const update = {};
    if (partname) update.partname = partname;
    if (amount) update.amount = amount;
    if (image) update.image = image;
    if (serviceId) update.serviceId = serviceId;

    const part = await Partsmodel.findByIdAndUpdate(id, update, { new: true });

    return res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Part updated successfully",
      data: part,
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

// get all service parts by service id
const GetPartsByServiceId = async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    console.log(serviceId);
    const parts = await Partsmodel.find({ serviceId }).lean();

    return res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Parts fetched successfully",
      data: parts,
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

// delete service parts

const DeleteServicePart = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Partsmodel.findByIdAndDelete(id);

    return res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Part deleted successfully",
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

// Sos services

// create Sos service
const CreateSosservice = async (req, res, next) => {
  try {
    let { servicename, image, vehicle_type } = req.body;
    if (
      ![
        APPLICATION_CONSTANT.CAR,
        APPLICATION_CONSTANT.BIKE,
        APPLICATION_CONSTANT.BUS,
        APPLICATION_CONSTANT.AUTO,
        APPLICATION_CONSTANT.TRUCK,
      ].includes(vehicle_type)
    ) {
      return next(
        new AppError("vechile type not matched", STATUS_CODE.VALIDATIONERROR)
      );
    }

    let service = await SosServicemodel.create(req.body);

    return res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "service created successfully",
      data: service,
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

// update service
const UpdateSosservice = async (req, res, next) => {
  try {
    let { servicename, image, vehicle_type, id } = req.body;
    if (vehicle_type) {
      if (
        ![
          APPLICATION_CONSTANT.CAR,
          APPLICATION_CONSTANT.BIKE,
          APPLICATION_CONSTANT.BUS,
          APPLICATION_CONSTANT.AUTO,
          APPLICATION_CONSTANT.TRUCK,
        ].includes(vehicle_type)
      ) {
        return next(
          new AppError("vechile type not matched", STATUS_CODE.VALIDATIONERROR)
        );
      }
    }

    const update = {};
    if (servicename) update.servicename = servicename;
    if (image) update.image = image;
    if (vehicle_type) update.vehicle_type;

    let service = await SosServicemodel.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    return res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "service Updated successfully",
      data: service,
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

// get service
const GetAllSosServices = async (req, res, next) => {
  try {
    const services = await SosServicemodel.find().lean();
    return res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Services fetched successfully",
      data: services,
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

// delete service
const DeleteSosService = async (req, res, next) => {
  try {
    const { id } = req.params;
    await SosServicemodel.findByIdAndDelete(id);
    return res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Service deleted successfully",
    });
  } catch (error) {
    return next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

module.exports = {
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
};
