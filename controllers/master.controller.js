const STATUS_CODE = require("../constant/status_code");
const Mastermodel = require("../models/master/master.model");
const { Vehcompanymodel } = require("../models/master/Vehicle_company.model");
const AppError = require("../utilits/appError");

// Create master settings
const createMaster = async (req, res, next) => {
  try {
    const {
      charge_per_km,
      platform_fee,
      commision_percentage,
      referral_bonus,
      mechanic_charge,
      discount_percentage,
    } = req.body;

    const exist = await Mastermodel.findOne();
    if (exist) {
      return next(
        new AppError("Master settings already exist", STATUS_CODE.CONFLICT)
      );
    }

    const master = await Mastermodel.create({
      charge_per_km,
      platform_fee,
      commision_percentage,
      referral_bonus,
      mechanic_charge,
      discount_percentage,
    });

    res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Master settings created",
      data: master,
    });
  } catch (error) {
    next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

// Update master settings
const updateMaster = async (req, res, next) => {
  try {
    const { id } = req.params;

    const master = await Mastermodel.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!master) {
      return next(
        new AppError("Master settings not found", STATUS_CODE.NOTFOUND)
      );
    }

    res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Master settings updated",
      data: master,
    });
  } catch (error) {
    next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

// Get master settings (latest or only one)
const getMaster = async (req, res, next) => {
  try {
    const master = await Mastermodel.findOne().sort({ createdAt: -1 });

    res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Master settings fetched",
      data: master,
    });
  } catch (error) {
    next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

const createVehCompany = async (req, res, next) => {
  try {
    const { companyname, image } = req.body;

    if (!companyname) {
      return next(
        new AppError("Company name is required", STATUS_CODE.VALIDATIONERROR)
      );
    }

    const exist = await Vehcompanymodel.findOne({ companyname });
    if (exist) {
      return next(
        new AppError("Company already exists", STATUS_CODE.VALIDATIONERROR)
      );
    }

    const vehCompany = await Vehcompanymodel.create({ companyname, image });

    res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Vehicle company created",
      data: vehCompany,
    });
  } catch (error) {
    next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

// Get All Vehicle Companies
const getAllVehCompanies = async (req, res, next) => {
  try {
    const companies = await Vehcompanymodel.find().sort({ createdAt: -1 });

    res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Vehicle companies fetched",
      data: companies,
    });
  } catch (error) {
    next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

// Get Single Vehicle Company
const getVehCompanyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const company = await Vehcompanymodel.findById(id);

    if (!company) {
      return next(
        new AppError("Vehicle company not found", STATUS_CODE.NOTFOUND)
      );
    }

    res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Vehicle company fetched",
      data: company,
    });
  } catch (error) {
    next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

// Update Vehicle Company
const updateVehCompany = async (req, res, next) => {
  try {
    const { id } = req.params;

    const updatedCompany = await Vehcompanymodel.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
      }
    );

    if (!updatedCompany) {
      return next(
        new AppError("Vehicle company not found", STATUS_CODE.NOTFOUND)
      );
    }

    res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Vehicle company updated",
      data: updatedCompany,
    });
  } catch (error) {
    next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

// Delete Vehicle Company
const deleteVehCompany = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deletedCompany = await Vehcompanymodel.findByIdAndDelete(id);

    if (!deletedCompany) {
      return next(
        new AppError("Vehicle company not found", STATUS_CODE.NOTFOUND)
      );
    }

    res.status(STATUS_CODE.SUCCESS).json({
      status: true,
      message: "Vehicle company deleted",
    });
  } catch (error) {
    next(new AppError(error.message, STATUS_CODE.SERVERERROR));
  }
};

module.exports = {
  createMaster,
  updateMaster,
  getMaster,
  createVehCompany,
  getAllVehCompanies,
  getVehCompanyById,
  updateVehCompany,
  deleteVehCompany,
};
