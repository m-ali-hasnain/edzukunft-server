import mongoose from "mongoose";
import { extend } from "../utils/index.js";
import userSchema from "./User.js";

const technicianSchema = extend(userSchema, {
  age: { type: Number, required: true, min: 18 },
  nationality: { type: String, required: true, trim: true },
  workAllowed: { type: Boolean, default: false },
  cvUrl: { type: String, default: "" },
  yearsOfExperience: { type: Number, default: 1 },
  isSubscribed: { type: Boolean, default: false },
  subscriptionType: { type: String, default: "" },
});
export default new mongoose.model("Tecnician", technicianSchema);
