import mongoose from "mongoose";

// Master list of departments. HR currently types the department name as a
// free-text string on the employee form (professional.department); Admin
// manages this canonical list so those free-text values stay consistent
// across the app instead of drifting into typos/duplicates over time.
const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    code: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
    },

    description: {
      type: String,
      trim: true,
      default: "",
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

export default mongoose.models.Department ||
  mongoose.model("Department", departmentSchema);
