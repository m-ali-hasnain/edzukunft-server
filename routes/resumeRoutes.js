import { saveResume, getResume } from "../controllers/resumeController.js";
import express from "express";

const router = express();
router.get("/", getResume);
router.put("/save", saveResume);

export default router;
