import mongoose from "mongoose";

const roundTypes = [
  "HR",
  "Technical",
  "Machine Coding",
  "Director",
  "Salary Discussion",
  "Document Verification",
  "Joining Form",
];

const recommendationTypes = [
  "strong_hire",
  "hire",
  "reject",
  "on_hold",
];

const interviewSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Visitor",
      required: true,
      index: true,
    },

    roundType: {
      type: String,
      enum: roundTypes,
      required: true,
    },

    interviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    scheduledDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled",
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
    },

    feedback: {
      type: String,
      trim: true,
    },

    recommendation: {
      type: String,
      enum: recommendationTypes,
    },

    completedAt: {
      type: Date,
    },

    cancelledReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

/* ================= UNIQUE ROUND PER CANDIDATE ================= */
/* Prevents scheduling same round twice */

interviewSchema.index(
  { candidate: 1, roundType: 1 },
  { unique: true }
);

/* ================= AUTO SET COMPLETED DATE ================= */

interviewSchema.pre("save", function () {
  if (this.isModified("status") && this.status === "completed") {
    this.completedAt = new Date();
  }
});

const Interview = mongoose.model("Interview", interviewSchema);

export default Interview;