import mongoose from "mongoose";
import cloudinary from "../../config/cloudinary.js";
import CandidateResume, {
  candidateCategories,
} from "../../models/candidateResume.model.js";
import { uploadToCloudinary } from "../../utils/uploadToCloudinary.js";

// GET CATEGORY MASTER LIST
// Powers the single Category dropdown on the "Add Candidate" form. This is
// the only classification field a candidate has — no separate domain list.

export const getCandidateResumeCategories = async (req, res) => {
  res.status(200).json({
    success: true,
    data: candidateCategories,
  });
};

// CREATE — HR fills this in while the candidate is present for interview

export const createCandidateResume = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      email,
      totalExperience,
      currentCtc,
      expectedCtc,
      currentOrganization,
      category,
      source,
      remarks,
    } = req.body;

    // Category is the ONLY mandatory field — everything else, including
    // the resume file, is optional so HR can save a candidate with just
    // their category selected.
    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    let resumeData = {};

    // Resume file is optional now — only upload to Cloudinary if provided.
    if (req.file) {
      const uploadResult = await uploadToCloudinary(
        req.file,
        "candidate-resumes"
      );

      resumeData = {
        resumeUrl: uploadResult.secure_url,
        resumePublicId: uploadResult.public_id,
        resumeResourceType: uploadResult.resource_type || "raw",
        resumeFileName: req.file.originalname,
      };
    }

    const candidate = new CandidateResume({
      fullName: fullName || "",
      phone: phone || "",
      email: email || "",
      totalExperience: totalExperience || undefined,
      currentCtc: currentCtc || "",
      expectedCtc: expectedCtc || "",
      currentOrganization: currentOrganization || "",
      category,
      source: source || "Walk-in",
      remarks: remarks || "",
      ...resumeData,
      addedBy: req.user?.id || null,
    });

    await candidate.save();

    res.status(201).json({
      success: true,
      message: "Candidate resume saved successfully",
      data: candidate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET — list with category filter, search & pagination

export const getCandidateResumes = async (req, res) => {
  try {
    const {
      category,
      status,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    let filter = {};

    if (category) filter.category = category;
    if (status) filter.status = status;

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const candidates = await CandidateResume.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await CandidateResume.countDocuments(filter);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      count: candidates.length,
      data: candidates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET BY ID

export const getCandidateResumeById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid candidate ID",
      });
    }

    const candidate = await CandidateResume.findById(id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate record not found",
      });
    }

    res.status(200).json({
      success: true,
      data: candidate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE — edit basic details / category / sub-category, optionally
// replacing the resume file (old Cloudinary asset is removed once the new
// one uploads successfully).

export const updateCandidateResume = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid candidate ID",
      });
    }

    const candidate = await CandidateResume.findById(id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate record not found",
      });
    }

    const {
      fullName,
      phone,
      email,
      totalExperience,
      currentCtc,
      expectedCtc,
      currentOrganization,
      category,
      source,
      remarks,
    } = req.body;

    // Category is the ONLY mandatory field on edit too.
    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    candidate.fullName = fullName || "";
    candidate.phone = phone || "";
    candidate.email = email || "";
    candidate.totalExperience = totalExperience || undefined;
    candidate.currentCtc = currentCtc || "";
    candidate.expectedCtc = expectedCtc || "";
    candidate.currentOrganization = currentOrganization || "";
    candidate.category = category;
    candidate.source = source || candidate.source;
    candidate.remarks = remarks || "";

    // Resume replaced? Upload the new one first, then clean up the old
    // Cloudinary asset only after the new one is safely stored.
    if (req.file) {
      const uploadResult = await uploadToCloudinary(
        req.file,
        "candidate-resumes"
      );

      const oldPublicId = candidate.resumePublicId;
      const oldResourceType = candidate.resumeResourceType;

      candidate.resumeUrl = uploadResult.secure_url;
      candidate.resumePublicId = uploadResult.public_id;
      candidate.resumeResourceType = uploadResult.resource_type || "raw";
      candidate.resumeFileName = req.file.originalname;

      if (oldPublicId) {
        try {
          await cloudinary.uploader.destroy(oldPublicId, {
            resource_type: oldResourceType || "raw",
          });
        } catch (cloudErr) {
          console.error(
            "Cloudinary delete failed for old candidate resume:",
            cloudErr.message
          );
        }
      }
    }

    await candidate.save();

    res.status(200).json({
      success: true,
      message: "Candidate updated successfully",
      data: candidate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE STATUS (e.g. move candidate to in-process / selected / rejected / completed)

export const updateCandidateResumeStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid candidate ID",
      });
    }

    const candidate = await CandidateResume.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate record not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Status updated successfully",
      data: candidate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE — removes the resume from Cloudinary too, so once the interview
// process is complete HR can fully purge the candidate's data.

export const deleteCandidateResume = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid candidate ID",
      });
    }

    const candidate = await CandidateResume.findById(id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate record not found",
      });
    }

    // Best-effort Cloudinary cleanup — if the asset is already gone /
    // Cloudinary errors out, we still proceed to delete the DB record so
    // HR isn't stuck with an un-deletable row.
    if (candidate.resumePublicId) {
      try {
        await cloudinary.uploader.destroy(candidate.resumePublicId, {
          resource_type: candidate.resumeResourceType || "raw",
        });
      } catch (cloudErr) {
        console.error(
          "Cloudinary delete failed for candidate resume:",
          cloudErr.message
        );
      }
    }

    await candidate.deleteOne();

    res.status(200).json({
      success: true,
      message: "Candidate record deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
