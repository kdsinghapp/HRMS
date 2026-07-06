import Offer from "../models/offer.model.js";
import Application from "../models/application.model.js";

/**
 * POST /offers
 */
export const createOffer = async (req, res) => {
  try {
    const { application, salary, joiningDate, notes } = req.body;

    // check application exists
    const existingApplication = await Application.findById(application);

    if (!existingApplication) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    const offer = await Offer.create({
      application,
      salary,
      joiningDate,
      notes,
    });

    // optional: move application stage to offer
    existingApplication.stage = "offer";
    await existingApplication.save();

    res.status(201).json({
      success: true,
      message: "Offer created successfully",
      data: offer,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message:
        error.code === 11000
          ? "Offer already exists for this application"
          : error.message,
    });
  }
};

/**
 * PATCH /offers/:id/status
 */
export const updateOfferStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const offer = await Offer.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found",
      });
    }

    // if accepted → move application to hired
    if (status === "accepted") {
      await Application.findByIdAndUpdate(
        offer.application,
        { stage: "hired" }
      );
    }

    // if rejected → move application to rejected
    if (status === "rejected") {
      await Application.findByIdAndUpdate(
        offer.application,
        { stage: "rejected" }
      );
    }

    res.status(200).json({
      success: true,
      message: "Offer status updated successfully",
      data: offer,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid Offer ID",
    });
  }
};

/**
 * GET /offers/:applicationId
 */
export const getOfferByApplication = async (req, res) => {
  try {
    const offer = await Offer.findOne({
      application: req.params.applicationId,
    }).populate({
      path: "application",
      populate: [
        { path: "candidate", select: "firstName lastName email" },
        { path: "job", select: "title company" },
      ],
    });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found for this application",
      });
    }

    res.status(200).json({
      success: true,
      data: offer,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid Application ID",
    });
  }
};



