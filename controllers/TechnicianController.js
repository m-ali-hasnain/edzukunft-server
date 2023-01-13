import TechnicianModel from "../models/Technician.js";
import { hashString, compareHashWithPlainStr } from "../utils/index.js";
import CustomError from "../middlewares/CustomError.js";
import { sendMail } from "../services/mailer.js";
import jwt from "jsonwebtoken";

// This action is for registering Technician
export const register = async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    password,
    confirmPassword,
    age,
    nationality,
  } = req.body;
  try {
    if (
      firstName &&
      lastName &&
      email &&
      password &&
      confirmPassword &&
      age &&
      nationality
    ) {
      // Let's check if email already exists
      const user = await TechnicianModel.findOne({ email });
      if (user) {
        throw new CustomError(
          false,
          "User with such email already exists",
          401
        );
      } else {
        // let's now check whether passwords are same or not
        if (password === confirmPassword) {
          // Let's encrypt password
          const hashedPassword = await hashString(password);
          // Let's now create our technician and save it to database
          const technician = new TechnicianModel({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            age,
            nationality,
          });

          // Finally lets save our technician
          await technician.save();
          // Let's now create JWT Token for email verification
          const token = jwt.sign(
            { technicianID: technician._id },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "1d" }
          );
          // let's now send email to verify account too
          const link = `${process.env.CLIENT_URL}/?id=${technician._id}&token=${token}`;
          sendMail(email, "Please Activate your Account", link);
          res.status(201).json({
            success: true,
            message:
              "An email has sent to your account, please verify to continue.",
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

// This action is for activating Technician's Account
export const activateAccount = (req, res, next) => {
  const { id, token } = req.query || req.params || req.body;
  if (token) {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, payload) => {
      if (err) {
        next(new CustomError(false, "Unauthorized Access.", 401));
      } else {
        try {
          const technician = await TechnicianModel.findOne({
            _id: payload.technicianID,
          });
          if (technician && id === technician._id.toString()) {
            if (technician.isActivated) {
              res.status(200).json({
                success: true,
                message: "Account is already active.",
              });
            } else {
              await TechnicianModel.findByIdAndUpdate(
                { _id: payload.technicianID },
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
      const technician = await TechnicianModel.findOne({ email });
      if (technician) {
        if (technician.isActivated) {
          // let's now compare passwords
          const matched = await compareHashWithPlainStr(
            password,
            technician?.password
          );
          if (matched) {
            // Creating access token
            const token = jwt.sign(
              { technicianID: technician?._id },
              process.env.ACCESS_TOKEN_SECRET,
              { expiresIn: "20s" }
            );
            // let's create refresh token for revoking access token
            const refreshToken = jwt.sign(
              { technicianID: technician?._id },
              process.env.REFRESH_TOKEN_SECRET,
              { expiresIn: "1d" }
            );
            // Let's now save refreshToken in cookie
            res.cookie("technicianJwt", refreshToken, {
              httpOnly: true,
              maxAge: 24 * 60 * 60 * 1000,
              secure: process.env.NODE_ENV === "production",
            });
            // also let's store refresh token in user database
            const updatedTechnician = await TechnicianModel.findByIdAndUpdate(
              { _id: technician?._id },
              { refreshToken },
              { new: true }
            ).select("-password");
            if (updatedTechnician) {
              res.status(200).json({
                success: true,
                message: "Logged In Successfully",
                user: updatedTechnician,
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
            "Please activate your account first",
            401
          );
        }
      } else {
        throw new CustomError(false, "No Such User exists");
      }
    } else {
      throw new CustomError(false, "Please Provide all fields", 422);
    }
  } catch (error) {
    next(error);
  }
};

// this action is for changing Technician password
export const changePassword = async (req, res, next) => {
  try {
    const { password, confirmPassword } = req.body;
    if (password && confirmPassword) {
      // let's now find technician who's requested to change his/her password
      const technician = await TechnicianModel.findOne({
        _id: req.technicianId,
      });
      if (technician) {
        if (technician.isActivated) {
          // checking if password and confirm password is same
          if (password === confirmPassword) {
            // hashing password now
            const hashedPassword = await hashString(password);
            await TechnicianModel.findByIdAndUpdate(
              { _id: technician?._id },
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
      const technician = await TechnicianModel.findOne({ email });
      if (technician) {
        if (technician.isActivated) {
          // generating reset link
          const token = jwt.sign(
            { technicianID: technician._id },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "1d" }
          );
          const link = `${process.env.CLIENT_URL}/technician/changePassword/${technician._id}/${token}`;
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

// This action is for resetting Technician password
export const resetPassword = async (req, res, next) => {
  try {
    const { technicianID, token } = req.query;
    const { password, confirmPassword } = req.body;
    if (technicianID && token) {
      if (password && confirmPassword) {
        const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (payload) {
          if (technicianID === payload.technicianID) {
            if (password === confirmPassword) {
              const user = await TechnicianModel.findOne({ _id: technicianID });
              if (user) {
                if (user.isActivated) {
                  // hashing password now
                  const hashedPassword = await hashString(password);
                  await TechnicianModel.findByIdAndUpdate(
                    { _id: technicianID },
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

// this action is for updating technician profile
export const updateProfile = async (req, res, next) => {
  try {
    if (
      Object.keys(req.body).length !== 0 &&
      !(
        Object.keys(req.body).includes("email") ||
        Object.keys(req.body).includes("password")
      )
    ) {
      const technicianExists = await TechnicianModel.findOne({
        _id: req.technicianId,
      });

      if (technicianExists) {
        if (technicianExists.isActivated) {
          const technician = await TechnicianModel.findByIdAndUpdate(
            { _id: req.technicianId },
            req.body,
            { new: true }
          ).select("-password");
          if (technician) {
            res.status(200).json({ success: true, user: technicianExists });
          } else {
            throw new CustomError(false);
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
    const token = req.cookies["technicianJwt"];
    if (token) {
      const technician = await TechnicianModel.findOne({ refreshToken: token });
      if (technician) {
        jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, payload) => {
          if (err) {
            throw new CustomError(false, "Unauthorized Access.", 401);
          } else {
            if (payload.technicianID === technician._id.toString()) {
              const accessToken = jwt.sign(
                { technicianID: technician._id },
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

// this action is for buying subscription
export const buySubscription = async (req, res, next) => {};

export const logout = async (req, res, next) => {
  try {
    const token = req.cookies["technicianJwt"];
    if (token) {
      const technician = await TechnicianModel.findOne({ refreshToken: token });
      if (technician) {
        jwt.verify(
          token,
          process.env.REFRESH_TOKEN_SECRET,
          async (err, payload) => {
            if (err) {
              throw new CustomError(false, "Unauthorized Access.", 401);
            } else {
              if (payload.technicianID === technician._id.toString()) {
                // clearing Cookie
                res.clearCookie("technicianJwt");
                // removing token from database
                TechnicianModel.findByIdAndUpdate(
                  { _id: payload.technicianID },
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
