// We will connect to data base in this file
import mongoose from "mongoose";
mongoose.set("strictQuery", false);

// This function connects to database
export const connectToDB = () => {
  let dbConfig = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };
  const DB_URI =
    process.env.NODE_ENV === "production"
      ? process.env.MONGO_URI
      : "mongodb://localhost:27017/temp2";
  mongoose
    .connect(DB_URI, process.env.NODE_ENV === "production" ? dbConfig : {})
    .then(() => {
      console.log("Connected To DB Successfully");
    })
    .catch((err) => {
      console.log("Error while connecting to database: ", err);
    });
};
