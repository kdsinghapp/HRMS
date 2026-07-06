import mongoose from "mongoose";
import bcrypt from "bcryptjs";

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

const interviewDomainOptions = [
  "MERN",
  "React",
  "Node.js",
  "Java",
  "Python",
  "DevOps",
  "UI/UX",
  "QA",
  "Data Science",
  "Flutter",
  "Android",
  "iOS",
];

const visitorSchema = new mongoose.Schema(
  {
    /* ================= VISIT TYPE ================= */

    type: {
      type: String,
      enum: ["enquiry", "training", "interview", "candidate", "client"],
      required: true,
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
    },

    source: {
      type: String,
      enum: ["Walk-in", "Online", "Referral", "LinkedIn"],
      default: "Walk-in",
    },

    /* ================= VISITOR SPECIFIC ================= */

    purposeOfVisit: String,
    personToMeet: String,

    visitDate: Date,
    checkInTime: Date,
    checkOutTime: Date,

    remarks: String,

    /* ================= CANDIDATE ONLY ================= */

    technology: String,

    /* ================= INTERVIEW ONLY ================= */

    domain: {
      type: String,
      enum: interviewDomainOptions,
    },

    jobSource: String,

    /* ================= AUTH ================= */

    password: {
      type: String,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

/* 🔐 Encrypt password before save */
visitorSchema.pre("save", async function () {
  if (!this.password) return;
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

export default mongoose.model("Visitor", visitorSchema);