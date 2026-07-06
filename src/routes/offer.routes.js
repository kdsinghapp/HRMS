import express from "express";
import {
  createOffer,
  updateOfferStatus,
  getOfferByApplication,
} from "../controllers/offer.controller.js";

const router = express.Router();

router.post("/", createOffer);
router.patch("/update/:id/status", updateOfferStatus);
router.get("/:applicationId", getOfferByApplication);

export default router;
