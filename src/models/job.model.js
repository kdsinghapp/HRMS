import mongoose from "mongoose";
import slugify from "slugify";

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },

    department: {
      type: String,
      enum: [
        "Development",
        "HR",
        "Sales",
        "Marketing",
        "Finance",
        "Operations",
        "Support",
        "Other",
      ],
      required: true,
      index: true,
    },

    companyName: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    workplaceType: {
      type: String,
      enum: ["On-Site", "Remote", "Hybrid"],
      required: true,
      index: true,
    },

    employmentType: {
      type: String,
      enum: [
        "Full-time",
        "Part-time",
        "Contract",
        "Internship",
        "Temporary",
        "Freelance",
      ],
      required: true,
      index: true,
    },

    experienceMin: {
      type: Number,
      min: 0,
      default: 0,
    },

    // FIXED EXPERIENCE MAX VALIDATOR
    experienceMax: {
      type: Number,
      min: 0,
      validate: {
        validator: function (value) {
          if (value == null) return true;

          // Check if this is an update query or a standard save
          const isUpdate = this.getUpdate ? true : false;

          if (isUpdate) {
            const updatePayload = this.getUpdate().$set || this.getUpdate();
            // If experienceMin is also being updated, use the new value; otherwise, it's not part of this payload
            const expMin = updatePayload.experienceMin;
            if (expMin === undefined) return true; // Skip if expMin isn't provided in the patch request
            return value >= expMin;
          }

          // Fallback for standard .save()
          return value >= this.experienceMin;
        },
        message: "experienceMax must be greater than or equal to experienceMin",
      },
    },

    overview: {
      type: String,
      required: true,
    },

    responsibilities: [
      {
        type: String,
        trim: true,
      },
    ],

    requiredSkills: {
      type: [String],
      validate: {
        validator: (val) => val.length > 0,
        message: "At least one required skill is needed",
      },
    },

    goodToHaveSkills: {
      type: [String],
    },

    qualifications: {
      type: String,
    },

    certifications: [
      {
        type: String,
        trim: true,
      },
    ],

    salaryMin: {
      type: Number,
      min: 0,
    },

    // FIXED SALARY MAX VALIDATOR
    salaryMax: {
      type: Number,
      min: 0,
      validate: {
        validator: function (value) {
          if (value == null) return true;

          // Check if this is an update query or a standard save
          const isUpdate = this.getUpdate ? true : false;

          if (isUpdate) {
            const updatePayload = this.getUpdate().$set || this.getUpdate();
            // If salaryMin is also being updated, use the new value
            const salMin = updatePayload.salaryMin;
            if (salMin === undefined) return true; // Skip if salMin isn't provided in the patch request
            return value >= salMin;
          }

          // Fallback for standard .save()
          return value >= this.salaryMin;
        },
        message: "salaryMax must be greater than or equal to salaryMin",
      },
    },

    currency: {
      type: String,
      enum: ["INR", "USD", "EUR", "GBP"],
      default: "INR",
    },

    benefits: [
      {
        type: String,
        trim: true,
      },
    ],

    applicationEmail: {
      type: String,
      match: /^\S+@\S+\.\S+$/,
    },

    applicationLink: {
      type: String,
    },

    applicationDeadline: {
      type: Date,
      index: true,
    },

    status: {
      type: String,
      enum: ["Draft", "Published", "Closed", "Archived"],
      default: "Draft",
      index: true,
    },

    visibility: {
      type: String,
      enum: ["Public", "Private"],
      default: "Private",
      index: true,
    },

    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OldEmployee",
      required: true,
    },

    totalApplications: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true },
);

// 🔥 Auto Slug Generator
jobSchema.pre("save", function () {
  if (!this.slug) {
    this.slug = slugify(this.title + "-" + Date.now(), {
      lower: true,
      strict: true,
    });
  }
});

const Job = mongoose.model("Job", jobSchema);

export default Job;
