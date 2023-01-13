import CustomError from "./CustomError.js";
import TechnicianModel from "../models/Technician.js";
import CompanyModel from "../models/Company.js";
import jwt from "jsonwebtoken";

// Not found middleware
export const notFound = (req, res, next) => {
  res.status(404).send("Not Found");
};

// Error handler middleware
export const errorHandler = (err, req, res, next) => {
  res
    .status(err.status || 500)
    .json({ ...err, message: err.message || "Internal Server error" });
};

// Middleware for checking whether Technician is authorized or not
export const isAuthorizedTechnician = async (req, res, next) => {
  try {
    const token = req.headers["authorization"].split(" ")[1];
    if (token) {
      // let's now verify jwt and get's payload
      jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        async (err, payload) => {
          try {
            if (err) {
              throw new CustomError(
                false,
                "Your Session has been expired. Please login to continue",
                440
              );
            } else {
              // let's now find technician who's requested to change his/her password
              const technician = await TechnicianModel.findOne({
                _id: payload.technicianID,
              });
              if (technician) {
                req.technicianId = technician?._id;
                next();
              } else {
                throw new CustomError(false, "Unauthorized Access", 401);
              }
            }
          } catch (error) {
            next(error);
          }
        }
      );
    } else {
      throw new CustomError(false, "Unauthorized Access", 401);
    }
  } catch (error) {
    next(error);
  }
};

// Middleware for checking whether company is authorized or not
export const isAuthorizedCompany = async (req, res, next) => {
  try {
    const token = req.headers["authorization"].split(" ")[1];
    if (token) {
      // let's now verify jwt and get's payload
      jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        async (err, payload) => {
          try {
            if (err) {
              throw new CustomError(
                false,
                "Your Session has been expired. Please login to continue",
                440
              );
            } else {
              // let's now find technician who's requested to change his/her password
              const company = await CompanyModel.findOne({
                _id: payload.companyID,
              });
              if (company) {
                req.companyId = company?._id;
                next();
              } else {
                throw new CustomError(false, "Unauthorized Access", 401);
              }
            }
          } catch (error) {
            next(error);
          }
        }
      );
    } else {
      throw new CustomError(false, "Unauthorized Access", 401);
    }
  } catch (error) {
    next(error);
  }
};

export const isCookieSetForCompany = (req, res, next) => {
  try {
    if (req.cookies.companyJwt) {
      next();
    } else {
      throw new CustomError(false, "Please Login to continue", 401);
    }
  } catch (error) {
    next(error);
  }
};

export const isCookieSetForTechnician = (req, res, next) => {
  try {
    if (req.cookies.technicianJwt) {
      next();
    } else {
      throw new CustomError(false, "Please Login to continue", 401);
    }
  } catch (error) {
    next(error);
  }
};
