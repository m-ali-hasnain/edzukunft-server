import mongoose from "mongoose";
import bcrypt from "bcrypt";
// This function extends Schemas
export const extend = (Schema, obj) =>
  new mongoose.Schema(Object.assign({}, Schema.obj, obj));

// This function hashString provided to it
export const hashString = async (str) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(str, salt);
};

// this function compares hashed String with plain string and returns boolean
export const compareHashWithPlainStr = async (plainStr, encryptedStr) => {
  return await bcrypt.compare(plainStr, encryptedStr);
};
