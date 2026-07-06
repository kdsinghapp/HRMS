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

  experienceMax: {
  type: Number,
  min: 0,
  // validate: {
  //   validator: function (value) {
  //     if (value == null) return true;
  //     return value >= this.experienceMin;
  //   },
  //   message: "experienceMax must be greater than experienceMin",
  // },
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

  salaryMax: {
  type: Number,
  min: 0,
  // validate: {
  //   validator: function (value) {
  //     if (value == null) return true;
  //     return value >= this.salaryMin;
  //   },
  //   message: "salaryMax must be greater than salaryMin",
  // },
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
