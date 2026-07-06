// import Job from "../models/Job.js";
import mongoose from "mongoose";
import slugify from "slugify";
import Job from "../../models/job.model.js";


// import jobModel from "../../models/job.model.js";
/* ================= CREATE JOB ================= */

export const createJob = async (req, res) => {
  try {
    const {
      title,
      department,
      companyName,
      location,
      workplaceType,
      employmentType,
      experienceMin,
      experienceMax,
      overview,
      responsibilities,
      requiredSkills,
      goodToHaveSkills,
      qualifications,
      certifications,
      salaryMin,
      salaryMax,
      currency,
      benefits,
      applicationEmail,
      applicationLink,
      applicationDeadline,
      visibility,
      status,
    } = req.body;
let currentUser_id = req.user.id.toString();
    const job = new Job({
      title,
      department,
      companyName,
      location,
      workplaceType,
      employmentType,
      experienceMin,
      experienceMax,
      overview,
      responsibilities,
      requiredSkills,
      goodToHaveSkills,
      qualifications,
      certifications,
      salaryMin,
      salaryMax,
      currency,
      benefits,
      applicationEmail,
      applicationLink,
      applicationDeadline,
      visibility,
      status,
      postedBy: currentUser_id,
      // postedBy: req.user._id, // from auth middleware
    });

    const savedJob = await job.save();

    res.status(201).json({
      success: true,
      message: "Job created successfully",
      data: savedJob,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= UPDATE JOB ================= */


export const updateJob = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate Job ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Job ID",
      });
    }

    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }
console.log("Job Posted By:", job.postedBy.toString());
console.log("Current User ID:", req.user.id.toString());
    // Ownership check
    if (job.postedBy.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this job",
      });
    }

    // Prevent editing closed jobs
// if (job.status === "Closed") {
//   const allowedFields = ["status"];

//   const updateFields = Object.keys(req.body).filter(
//     (field) => field !== "_id"
//   );

//   const isOnlyStatusUpdate = updateFields.every((field) =>
//     allowedFields.includes(field)
//   );

//   if (!isOnlyStatusUpdate) {
//     return res.status(400).json({
//       success: false,
//       message: "Closed jobs can only update status",
//     });
//   }
// }

    const updateData = { ...req.body };

    // Restricted fields
    const restrictedFields = [
      "postedBy",
      "slug",
      "createdAt",
      "updatedAt",
      "__v",
      "totalApplications",
      "isActive",
    ];

    restrictedFields.forEach((field) => delete updateData[field]);

    // Regenerate slug if title changed
    if (updateData.title && updateData.title !== job.title) {
      updateData.slug = slugify(`${updateData.title}-${Date.now()}`, {
        lower: true,
        strict: true,
      });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Job updated successfully",
      data: updatedJob,
    });

  } catch (error) {
    console.error("Update Job Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= DELETE JOB (SOFT DELETE) ================= */

export const deleteJob = async (req, res) => {
  // console.log("deleteJob")
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Job ID",
      });
    }

    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Ownership check
    if (job.postedBy.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this job",
      });
    }

    // Optional safety check
    if (job.status !== "Archived") {
      return res.status(400).json({
        success: false,
        message: "Only archived jobs can be deleted permanently",
      });
    }

    await Job.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Job deleted permanently",
    });

  } catch (error) {
    console.error("Delete Job Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= GET ALL JOBS (ADMIN) ================= */
export const getAllJobs = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = {
      postedBy: new mongoose.Types.ObjectId(req.user._id),
      isActive: true,
    };

    // const query = {};

    if (status) {
      query.status = status;
    }

    // const jobs = await Job.find(query) // ✅ query yaha use karo

    const jobs = await Job.find()
      .populate("requiredSkills goodToHaveSkills")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Job.countDocuments(query);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      data: jobs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= GET SINGLE JOB BY SLUG ================= */
export const getJobBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const job = await Job.findOne({
      slug,
      status: "Published",     // Only published jobs
      visibility: "Public",    // Only public jobs
      isActive: true,          // Only active jobs
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: job,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

