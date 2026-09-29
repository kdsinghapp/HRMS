import mongoose from "mongoose";

// Master list of designations/job titles, optionally scoped to a
// department. Same idea as Department — gives Admin a single place to
// govern the canonical values HR picks from instead of free text.
const designationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OldEmployee",
      default: null,
    },
  },
  { timestamps: true },
);

designationSchema.index({ title: 1, department: 1 }, { unique: true });

export default mongoose.models.Designation ||
  mongoose.model("Designation", designationSchema);
