import mongoose from "mongoose";
import { extend } from "../utils/index.js";
import userSchema from "./User.js";
const companySchema = extend(userSchema, {
  address: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true },
  ndaUrl: { type: String, default: "" },
  isAuthorized: { type: Boolean, default: false }
});
export default new mongoose.model("Company", companySchema);
