import Resume from "../models/resume.js";
import CustomError from "../middlewares/CustomError.js";

export const saveResume = async (req, res, next) => {
  const { id } = req.params || req.query;
  console.log("id: ", id);
  console.log("body: ", req.body);
  try {
    const body = req.body;
    if (id !== undefined) {
      const updatedResume = await Resume.findByIdAndUpdate(
        { _id: id },
        { details: body }
      );
      res.status(200).json(updatedResume);
    }
    const newResume = new Resume(body);
    await newResume.save();
    res.status(200).json(newResume);
  } catch (error) {
    res.status(500).json(error);
  }
};

export const getResume = async (req, res) => {
  try {
    const { id } = req.query || req.params;
    if (id) {
      const resume = await Resume.findById({ _id: id });
      if (resume) {
        res.status(200).json(resume);
      } else {
        throw new CustomError(false, 403, "Forbidden");
      }
    } else {
      throw new CustomError(false, "Please Provide all fields", 422);
    }
  } catch (error) {
    throw new CustomError();
  }
};
