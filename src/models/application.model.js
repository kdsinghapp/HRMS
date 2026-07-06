import mongoose from "mongoose";

/* ================= ENUM ARRAYS ================= */

const experienceOptions = [
  "Less than 1 year",
  "1-2 years",
  "2-3 years",
  "3-4 years",
  "4-5 years",
  "5-6 years",
  "6-7 years",
  "7-8 years",
  "8-9 years",
  "9-10 years",
  "10+ years",
];

const applicationSchema = new mongoose.Schema(
  {
    /* ================= JOB LINK ================= */

    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },

    /* ================= COMMON CANDIDATE FIELDS ================= */

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    totalExperience: {
      type: String,
      enum: experienceOptions,
    },

    currentCtc: {
      type: String,
    },

    expectedCtc: {
      type: String,
    },

    currentOrganization: {
      type: String,
      trim: true,
    },

    skills: [
      {
        type: String,
        trim: true,
      },
    ],

    resumeUrl: {
      type: String,
      required: true,
    },

    source: {
      type: String,
      enum: ["Walk-in", "Online", "Referral", "LinkedIn"],
      default: "Online",
    },

    /* ================= APPLICATION SPECIFIC ================= */

    coverLetter: {
      type: String,
    },

    status: {
      type: String,
      enum: [
        "Applied",
        "Shortlisted",
        "Interview",
        "Rejected",
        "Hired",
      ],
      default: "Applied",
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Application", applicationSchema);