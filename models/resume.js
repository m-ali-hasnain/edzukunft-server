import mongoose from "mongoose";
const resumeSchema = mongoose.Schema({
  details: {
    personalDetails: {
      firstName: { type: String, default: "", trim: true },
      lastName: { type: String, default: "", trim: true },
      email: { type: String, default: "", trim: true },
      phoneNo: { type: String, default: "", trim: true },
      address: { type: String, default: "", trim: true },
      socialLinks: { type: Array, default: [] },
      title: { type: String, default: "", trim: true },
    },
    educationDetails: { type: Array, default: [] },
    experienceDetails: { type: Array, default: [] },
    skillsDetails: {
      type: Array,
      default: [
        {
          id: 1,
          title: "Programming Languages",
          placeHolder: ["C++", "Python", "Java", "C#"],
          value: [],
        },
        {
          id: 2,
          title: "Libraries / Frameworks",
          placeHolder: ["React JS", "Ruby On Rails", "Express JS"],
          value: [],
        },
        {
          id: 3,
          title: "Tools / Platforms",
          placeHolder: ["VS Code", "GitHub", "Docker"],
          value: [],
        },
        {
          id: 4,
          title: "Databases",
          placeHolder: ["Mongo", "SQL", "PostgreSQL"],
          value: [],
        },
      ],
    },
    projectsDetails: { type: Array, default: [] },
    certificationDetails: { type: Array, default: [] },
    awardDetails: { type: Array, default: [] },
  },
});

export default new mongoose.model("Resume", resumeSchema);
