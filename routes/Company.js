import express from "express";
import {
  register,
  login,
  changePassword,
  sendResetPasswordLink,
  resetPassword,
  updateProfile,
  activateAccount,
  revokeAccessToken,
  logout,
} from "../controllers/CompanyController.js";
import {
  isAuthorizedCompany,
  isCookieSetForCompany,
} from "../middlewares/index.js";
const router = express();

// public routes for company
router.post("/register", register);
router.post("/activateAccount", isCookieSetForCompany, activateAccount);

router.post("/login", login);
router.post("/sendResetPasswordLink", sendResetPasswordLink);
router.put("/resetPassword", resetPassword);
router.get("/revoke-access-token", isCookieSetForCompany, revokeAccessToken);
router.delete("/logout", logout);

// protected routes for company
router.put(
  "/changePassword",
  isAuthorizedCompany,
  isCookieSetForCompany,
  changePassword
);
router.put(
  "/updateProfile",
  isAuthorizedCompany,
  isCookieSetForCompany,
  updateProfile
);
export default router;
