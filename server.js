import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import path from "path";
import cookieParser from "cookie-parser";
import { connectToDB } from "./config/db.js";

// Importing Routes
import technicianRouter from "./routes/Technician.js";
import companyRouter from "./routes/Company.js";
import resumeRouter from "./routes/resumeRoutes.js";

// Importing Middlewares
import { notFound, errorHandler } from "./middlewares/index.js";

// Current Working Directory
const __dirname = path.resolve(
  path.dirname(decodeURI(new URL(import.meta.url).pathname))
);

// Creating express app
const app = express();

// Configuring ENV file
dotenv.config({ path: path.resolve(__dirname, "config/.env") });

// Registering APP level middlewares
const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// Let's now connect To DB
connectToDB();

// Registering Routes
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Credentials", true);
  next();
});

app.use("/api/v1/technician", technicianRouter);
app.use("/api/v1/company", companyRouter);
app.use("/api/v1/resume", resumeRouter);

// Registering middlewares
app.use(notFound);
app.use(errorHandler);

// Creating server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is listening on ${PORT}`);
});
