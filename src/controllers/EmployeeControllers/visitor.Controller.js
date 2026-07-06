import Visitor from "../../models/Visitor.js";
import mongoose from "mongoose";

/* ================= CREATE ================= */

export const createVisitor = async (req, res) => {
  console.log("api called");
  try {
    const {
      type,
      fullName,
      phone,
      email,
      purposeOfVisit,
      personToMeet,
      visitDate,
      checkInTime,
      checkOutTime,
      remarks,
      technology,
      domain,
      totalExperience,
      currentCtc,
      expectedCtc,
      currentOrganization,
      jobSource,
    } = req.body;
// console.log("body",req.body)
    /* ================= BASIC VALIDATION ================= */

    if (!type || !fullName || !phone || !email) {
      return res.status(400).json({
        success: false,
        message: "Type, Full Name, Phone and Email are required",
      });
    }

    /* ================= BUILD CLEAN PAYLOAD ================= */

    const visitorData = {
      type,
      fullName,
      phone,
      email,
      purposeOfVisit: purposeOfVisit || "",
      personToMeet: personToMeet || "",
      visitDate: visitDate ? new Date(visitDate) : null,
      checkInTime: checkInTime ? new Date(checkInTime) : null,
      checkOutTime: checkOutTime ? new Date(checkOutTime) : null,
      remarks: remarks || "",
      status: "pending", // always default
    };
// console.log("visitorData",visitorData)
    /* ================= CONDITIONAL FIELDS ================= */

    // If Candidate → add technology
    if (type === "candidate" && technology) {
      visitorData.technology = technology;
    }

    // If Interview → add interview specific fields
    if (type === "interview") {
      visitorData.domain = domain || "";
      visitorData.totalExperience = totalExperience || 0;
      visitorData.currentCtc = currentCtc || 0;
      visitorData.expectedCtc = expectedCtc || 0;
      visitorData.currentOrganization = currentOrganization || "";
      visitorData.jobSource = jobSource || "";
    }

    /* ================= SAVE ================= */

    const visitor = new Visitor(visitorData);
    await visitor.save();

    res.status(201).json({
      success: true,
      message: "Visitor created successfully",
      data: visitor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= GET WITH FILTER ================= */

export const getVisitors = async (req, res) => {
  try {
    const { type, status, search, page = 1, limit = 10 } = req.query;

    let filter = {};

    // Filter by type
    if (type) filter.type = type;

    // Filter by status
    if (status) filter.status = status;

    // Search
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const visitors = await Visitor.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Visitor.countDocuments(filter);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      count: visitors.length,
      data: visitors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* ================= GET BY ID ================= */
/* ================= GET VISITOR BY ID ================= */

export const getVisitorById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid visitor ID",
      });
    }

    const visitor = await Visitor.findById(id);

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: "Visitor not found",
      });
    }

    res.status(200).json({
      success: true,
      data: visitor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* ================= APPROVE + SET PASSWORD ================= */
export const updateVisitorStatus = async (req, res) => {
  console.log("api updateVisitorStatus")
  try {
    const { status, password } = req.body;
    console.log(status, password)

    const visitor = await Visitor.findById(req.params.id);

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: "Visitor not found",
      });
    }

    // If approving, password required
    if (status === "approved") {
      if (!password) {
        return res.status(400).json({
          success: false,
          message: "Password is required for approval",
        });
      }

      visitor.password = password; // will auto hash
    }

    visitor.status = status;

    await visitor.save();

    res.json({
      success: true,
      message: `Visitor ${status} successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
