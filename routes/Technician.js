import express from "express";
import {
  register,
  login,
  changePassword,
  sendResetPasswordLink,
  resetPassword,
  updateProfile,
  buySubscription,
  activateAccount,
  revokeAccessToken,
  logout,
} from "../controllers/TechnicianController.js";
import {
  isAuthorizedTechnician,
  isCookieSetForTechnician,
} from "../middlewares/index.js";
const router = express();

// public routes for technician
router.post("/register", register);
router.post("/activateAccount", isCookieSetForTechnician, activateAccount);
router.post("/login", login);
router.post("/sendResetPasswordLink", sendResetPasswordLink);
router.put("/resetPassword", resetPassword);
router.get("/revoke-access-token", isCookieSetForTechnician, revokeAccessToken);
router.delete("/logout", logout);
// protected routes for technician
router.put(
  "/changePassword",
  isAuthorizedTechnician,
  isCookieSetForTechnician,
  changePassword
);
router.put(
  "/updateProfile",
  isAuthorizedTechnician,
  isCookieSetForTechnician,
  updateProfile
);
router.post(
  "/buySubscription",
  isAuthorizedTechnician,
  isCookieSetForTechnician,
  buySubscription
);
export default router;
