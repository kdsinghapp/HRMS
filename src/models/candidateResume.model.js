import mongoose from "mongoose";

// Single, flat master list of candidate categories/domains. This is the
// ONLY classification field on a candidate now — there is no separate
// department -> domain hierarchy anymore. Kept here (not in the DB-driven
// Department master) so this feature works standalone for HR without
// needing Admin-only endpoints — see candidateResume.controller.js's
// getCandidateResumeCategories, which exposes this same list to the
// frontend for the add-candidate form.
export const candidateCategories = [
  "PHP",
  "Laravel",
  "Blockchain",
  "AI / ML",
  "Flutter",
  "Android",
  "iOS",
  "DevOps",
  "Python",
  "Data Analytics",
  "Data Science",
  "Digital Marketing",
  "Business Development (BD)",
  "QA / Testing",
  "UI/UX",
  "React Native",
  "MERN",
  "React.js",
  "Node.js",
  "Angular",
  "HR / Administration",
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "MERN Developer",
  "Java",
  "Spring Boot",
  ".NET",
  "C#",
  "WordPress",
  "Cloud / AWS",
  "Django",
  "Vue.js",
  "Next.js",
  "Other",
];

const experienceOptions = [
  "Fresher",
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

const candidateResumeSchema = new mongoose.Schema(
  {
    // BASIC DETAILS (filled by HR when the candidate walks in)

    fullName: {
      type: String,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    totalExperience: {
      type: String,
      enum: experienceOptions,
    },

    currentCtc: {
      type: String,
      trim: true,
    },

    expectedCtc: {
      type: String,
      trim: true,
    },

    currentOrganization: {
      type: String,
      trim: true,
    },

    // CATEGORY — single source of classification for the candidate
    // (e.g. "MERN", "PHP", "UI/UX"). This is the only mandatory field.

    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },

    source: {
      type: String,
      enum: ["Walk-in", "Online", "Referral", "LinkedIn", "Other"],
      default: "Walk-in",
    },

    remarks: {
      type: String,
      trim: true,
    },

    // RESUME FILE (Cloudinary)

    resumeUrl: {
      type: String,
    },

    resumePublicId: {
      // Needed to delete the exact same asset from Cloudinary later.
      type: String,
    },

    resumeResourceType: {
      // Cloudinary needs this to know how to delete the asset
      // (raw for pdf/doc, image for jpg/png).
      type: String,
      default: "raw",
    },

    resumeFileName: {
      type: String,
      trim: true,
    },

    // STATUS — lets HR track the interview process before purging the record

    status: {
      type: String,
      enum: ["pending", "in-process", "selected", "rejected", "completed"],
      default: "pending",
    },

    // Who added this candidate (HR employee)
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OldEmployee",
      default: null,
    },
  },
  { timestamps: true }
);

candidateResumeSchema.index({ category: 1 });
candidateResumeSchema.index({ fullName: "text", email: "text", phone: "text" });

export default mongoose.model("CandidateResume", candidateResumeSchema);
