import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  isActivated: { type: Boolean, default: false },
  refreshToken: { type: String, default: "" },
  profilePicUrl: {
    type: String,
    default: "https://cdn-icons-png.flaticon.com/512/6342/6342703.png",
    trim: true,
  },
});
export default userSchema;
