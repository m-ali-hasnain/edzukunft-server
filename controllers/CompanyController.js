import CompanyModel from "../models/Company.js";
import { hashString, compareHashWithPlainStr } from "../utils/index.js";
import { sendMail } from "../services/mailer.js";
import CustomError from "../middlewares/CustomError.js";
import jwt from "jsonwebtoken";

// This action is for registering Technician
export const register = async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    password,
    confirmPassword,
    address,
    country,
  } = req.body;
  try {
    if (
      firstName &&
      lastName &&
      email &&
      password &&
      confirmPassword &&
      address &&
      country
    ) {
      // Let's check if email already exists
      const user = await CompanyModel.findOne({ email });
      if (user) {
        throw new CustomError(
          false,
          "Company with such email already exists",
          401
        );
      } else {
        // let's now check whether passwords are same or not
        if (password === confirmPassword) {
          // Let's encrypt password
          const hashedPassword = await hashString(password);
          // Let's now create our technician and save it to database
          const company = new CompanyModel({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            address,
            country,
          });

          // Finally lets save our technician
          await company.save();

          // Let's now create JWT Token for email verification
          const token = jwt.sign(
            { companyID: company._id },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "1d" }
          );
          // let's now send email to verify account too
          const link = `${process.env.CLIENT_URL}/${company._id}/${token}`;
          sendMail(email, "Please Activate your Account", link);
          res.status(201).json({
            success: true,
            message:
              "An email has sent to your account, please verify to continue.",
            link,
          });
        } else {
          throw new CustomError(false, "Password's doesn't matched", 401);
        }
      }
    } else {
      throw new CustomError(false, "Please provide all fields", 422);
    }
  } catch (error) {
    next(error);
  }
};

// This action is for activating Company's Account
export const activateAccount = (req, res, next) => {
  const { id, token } = req.query || req.params || req.body;
  if (token) {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, payload) => {
      if (err) {
        next(new CustomError(false, "Unauthorized Access.", 401));
      } else {
        try {
          const company = await CompanyModel.findOne({
            _id: payload.companyID,
          });
          if (company && company._id.toString() === id) {
            if (company.isActivated) {
              res.status(200).json({
                success: true,
                message: "Account is already active.",
              });
            } else {
              await CompanyModel.findByIdAndUpdate(
                { _id: payload.companyID },
                { isActivated: true },
                { new: true }
              );
              res.status(200).json({
                sucess: true,
                message: "Your account is now activated",
              });
            }
          } else {
            throw new CustomError(false, "Unauthorized Access", 401);
          }
        } catch (error) {
          next(error);
        }
      }
    });
  } else {
    next(CustomError(false, "Unauthorized Access", false));
  }
};

// this action is for authenticating Technician
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (email && password) {
      const company = await CompanyModel.findOne({ email });
      if (company) {
        if (company.isActivated) {
          // let's now compare passwords
          const matched = await compareHashWithPlainStr(
            password,
            company?.password
          );
          if (matched) {
            // Creating access token
            const token = jwt.sign(
              { companyID: company?._id },
              process.env.ACCESS_TOKEN_SECRET,
              { expiresIn: "20s" }
            );
            // let's create refresh token for revoking access token
            const refreshToken = jwt.sign(
              { companyID: company?._id },
              process.env.REFRESH_TOKEN_SECRET,
              { expiresIn: "1d" }
            );
            // Let's now save refreshToken in cookie
            res.cookie("companyJwt", refreshToken, {
              httpOnly: false,
              maxAge: 24 * 60 * 60 * 1000,
              // secure: process.env.NODE_ENV === "production",
            });
            // also let's store refresh token in user database
            const updatedCompany = await CompanyModel.findByIdAndUpdate(
              { _id: company?._id },
              { refreshToken },
              { new: true }
            ).select("-password");
            if (updatedCompany) {
              res.status(200).json({
                success: true,
                message: "Logged In Successfully",
                user: updatedCompany,
                token,
              });
            } else {
              throw new CustomError();
            }
          } else {
            throw new CustomError(false, "Invalid Password", 401);
          }
        } else {
          throw new CustomError(
            false,
            "Please Activate your account first",
            401
          );
        }
      } else {
        throw new CustomError(false, "No Such Company Exists");
      }
    } else {
      throw new CustomError(false, "Please Provide all fields", 422);
    }
  } catch (error) {
    next(error);
  }
};

// this action is for changing User password
export const changePassword = async (req, res, next) => {
  try {
    const { password, confirmPassword } = req.body;
    if (password && confirmPassword) {
      // let's now find technician who's requested to change his/her password
      const company = await CompanyModel.findOne({
        _id: req.companyId,
      });
      if (company) {
        if (company.isActivated) {
          // checking if password and confirm password is same
          if (password === confirmPassword) {
            // hashing password now
            const hashedPassword = await hashString(password);
            await CompanyModel.findByIdAndUpdate(
              { _id: company?._id },
              { password: hashedPassword },
              { new: true }
            );
            res.status(200).json({
              success: true,
              message: "password is updated Successfully",
            });
          } else {
            throw new CustomError(false, "Password's doesn't matched", 401);
          }
        } else {
          throw new CustomError(
            false,
            "Please Activate your account first",
            401
          );
        }
      } else {
        throw new CustomError(false, "Unauthorized access", 401);
      }
    } else {
      throw new CustomError(false, "Please provide all fields", 422);
    }
  } catch (error) {
    next(error);
  }
};

// this action is for sending reset password link
export const sendResetPasswordLink = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (email) {
      const company = await CompanyModel.findOne({ email });
      if (company) {
        if (company.isActivated) {
          // generating reset link
          const token = jwt.sign(
            { companyID: company._id },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "1d" }
          );
          const link = `${process.env.CLIENT_URL}/company/changePassword/${company._id}/${token}`;
          // calling mail service
          sendMail(email, "Reset Password", link);
          res.status(200).send(link);
        } else {
          throw new CustomError(
            false,
            "Please activate your account first",
            401
          );
        }
      } else {
        throw new CustomError(false, "No such user exists", 401);
      }
    } else {
      throw new CustomError(false, "Please Provide all fields", 422);
    }
  } catch (error) {
    next(error);
  }
};

// This action is for resetting company's password
export const resetPassword = async (req, res, next) => {
  try {
    const { companyID, token } = req.query;
    console.log("Token: ", token);
    const { password, confirmPassword } = req.body;
    if (companyID && token) {
      if (password && confirmPassword) {
        const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (payload) {
          if (companyID === payload.companyID) {
            if (password === confirmPassword) {
              const user = await CompanyModel.findOne({ _id: companyID });
              if (user) {
                if (user.isActivated) {
                  // hashing password now
                  const hashedPassword = await hashString(password);
                  await CompanyModel.findByIdAndUpdate(
                    { _id: companyID },
                    { password: hashedPassword },
                    { new: true }
                  );
                  res.status(200).json({
                    success: true,
                    message: "password is updated Successfully",
                  });
                } else {
                  throw new CustomError(
                    false,
                    "Please Activate your account first",
                    401
                  );
                }
              } else {
                throw new CustomError(false, "Unauthorized Access", 401);
              }
            } else {
              throw new CustomError(false, "password's doesnt matched", 401);
            }
          } else {
            throw new CustomError(false, "Unauthorized Access", 401);
          }
        } else {
          throw new CustomError(false, 401, "Unauthorized Access.");
        }
      } else {
        throw new CustomError(false, "Please provide all fields", 422);
      }
    } else {
      throw new CustomError(false, "Unauthorized Access.", 401);
    }
  } catch (error) {
    next(error);
  }
};

// this action is for updating company profile
export const updateProfile = async (req, res, next) => {
  try {
    if (
      Object.keys(req.body).length !== 0 &&
      !(
        Object.keys(req.body).includes("email") ||
        Object.keys(req.body).includes("password")
      )
    ) {
      const companyExists = await CompanyModel.findOne({
        _id: req.companyId,
      });

      if (companyExists) {
        if (companyExists.isActivated) {
          let body = req.body;
          if (Object.keys(body).includes("ndaUrl")) {
            body = { ...body, isAuthorized: true };
          }
          const company = await CompanyModel.findByIdAndUpdate(
            { _id: req.companyId },
            req.body,
            { new: true }
          ).select("-password");

          if (company) {
            res.status(200).json({ success: true, user: company });
          } else {
            throw new CustomError();
          }
        } else {
          throw new CustomError(false, "Please Activate your account first");
        }
      } else {
        throw new CustomError(false, "Unauthorized Access.", 401);
      }
    } else {
      throw new CustomError(
        false,
        "Please provide valid fields to update",
        422
      );
    }
  } catch (error) {
    next(error);
  }
};

// This action is for revoking access token for company
export const revokeAccessToken = async (req, res, next) => {
  try {
    const token = req.cookies["companyJwt"];
    if (token) {
      const company = await CompanyModel.findOne({ refreshToken: token });
      if (company) {
        jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, payload) => {
          if (err) {
            throw new CustomError(false, "Unauthorized Access.", 401);
          } else {
            if (payload.companyID === company._id.toString()) {
              const accessToken = jwt.sign(
                { companyID: company._id },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: "20s" }
              );
              res.status(200).json({ success: true, accessToken });
            } else {
              throw new CustomError(false, "Unauthorized Access.", 401);
            }
          }
        });
      } else {
        throw new CustomError(false, "Unauthorized Access.", 401);
      }
    } else {
      throw new CustomError(false, "Unauthorized Access.", 401);
    }
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const token = req.cookies["companyJwt"];
    if (token) {
      const company = await CompanyModel.findOne({ refreshToken: token });
      if (company) {
        jwt.verify(
          token,
          process.env.REFRESH_TOKEN_SECRET,
          async (err, payload) => {
            if (err) {
              throw new CustomError(false, "Unauthorized Access.", 401);
            } else {
              if (payload.companyID === company._id.toString()) {
                // clearing Cookie
                res.cookie("companyJwt", null, { expiresIn: Date.now() });
                // removing token from database
                CompanyModel.findByIdAndUpdate(
                  { _id: payload.companyID },
                  { refreshToken: "" }
                )
                  .then(() => {
                    res.status(200).json({
                      success: true,
                      message: "Logged Out Successfully",
                    });
                  })
                  .catch((err) => {
                    throw new CustomError();
                  });
              } else {
                throw new CustomError(false, "Unauthorized Access.", 401);
              }
            }
          }
        );
      } else {
        throw new CustomError(false, "Unauthorized Access.", 401);
      }
    } else {
      throw new CustomError(false, "Unauthorized Access.", 401);
    }
  } catch (error) {
    next(error);
  }
};
