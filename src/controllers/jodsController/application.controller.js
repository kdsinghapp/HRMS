import Application from "../../models/application.model.js";
import Job from "../../models/job.model.js";
import { createAuditLog } from "../../services/audit.service.js";

/* =====================================================
   APPLY FOR JOB (PUBLIC)
===================================================== */
export const applyForJob = async (req, res) => {
  // console.log("Job apply api called"); // Debugging log
  try {
    const { jobId } = req.params;

    /* ================= JOB VALIDATION ================= */
    const job = await Job.findById(jobId);
    console.log("Job found:", job); // Debugging log
    if (!job || job.status !== "Published" || !job.isActive) {
      return res.status(400).json({
        success: false,
        message: "Job is not available",
      });
    }

    /* ================= BODY DATA ================= */
    const {
      fullName,
      phone,
      email,
      totalExperience,
      currentCtc,
      expectedCtc,
      currentOrganization,
      skills,
      resumeUrl,
      source,
      coverLetter,
    } = req.body;

    /* ================= REQUIRED VALIDATION ================= */
    if (!fullName || !phone || !email || !resumeUrl) {
      return res.status(400).json({
        success: false,
        message: "Full name, phone, email and resume link are required",
      });
    }

    /* ================= RESUME URL VALIDATION ================= */
    if (!resumeUrl.startsWith("http")) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid resume URL",
      });
    }

    /* ================= DUPLICATE CHECK ================= */
    const existing = await Application.findOne({
      job: jobId,
      email: email.toLowerCase(),
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You already applied for this job",
      });
    }

    /* ================= SKILLS PARSING ================= */
    let parsedSkills = [];

    if (skills) {
      if (Array.isArray(skills)) {
        parsedSkills = skills;
      } else if (typeof skills === "string") {
        parsedSkills = skills.split(",").map((s) => s.trim());
      }
    }

    /* ================= CREATE APPLICATION ================= */
    const application = await Application.create({
      job: jobId,
      fullName,
      phone,
      email: email.toLowerCase(),
      totalExperience,
      currentCtc,
      expectedCtc,
      currentOrganization,
      skills: parsedSkills,
      resumeUrl,
      source: source || "Online",
      coverLetter,
      status: "Applied",
    });

    /* ================= INCREMENT JOB COUNT ================= */
    await Job.findByIdAndUpdate(jobId, {
      $inc: { totalApplications: 1 },
    });

    return res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: application,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   GET ALL APPLICATIONS (ADMIN)
===================================================== */
export const getAllApplications = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = {};

    // Status filter
    if (status && status !== "Applied") {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const applications = await Application
      .find(query)
      .populate("job", "title department")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Application.countDocuments(query);

    res.status(200).json({
      success: true,
      data: applications,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      totalApplications: total,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   UPDATE APPLICATION STATUS (PIPELINE CONTROL)
===================================================== */

export const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const oldApplication = await Application.findById(req.params.id);

    if (!oldApplication) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Prevent same status update
    if (oldApplication.status === status) {
      return res.status(400).json({
        success: false,
        message: "Status already set to this value",
      });
    }

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    // Call audit log service
    await createAuditLog({
      user: req.user,
      action: "UPDATE_APPLICATION_STATUS",
      module: "Application",
      recordId: application._id,
      oldData: { status: oldApplication.status },
      newData: { status },
      req,
    });

    res.json({
      success: true,
      message: "Status updated successfully",
      data: application,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   GET APPLICATIONS BY JOB
===================================================== */
export const getApplicationsByJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const applications = await Application.find({ job: jobId }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      data: applications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   GET SINGLE APPLICATION
===================================================== */
export const getSingleApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id).populate(
      "job",
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    res.json({
      success: true,
      data: application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



/* =====================================================
   DELETE APPLICATION (ADMIN)
===================================================== */
export const deleteApplication = async (req, res) => {
  try {
    const application = await Application.findByIdAndDelete(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    res.json({
      success: true,
      message: "Application deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
