import express from "express";
import Support from "../models/Support.js";

const router = express.Router();


// 👉 CREATE support ticket
router.post("/create", async (req, res) => {
  try {
    const { name, email, category, message, id } = req.body;

    const newTicket = await Support.create({
      name,
      email,
      category,
      message,
    });

    res.status(201).json({
      success: true,
      message: "Support ticket created",
      data: newTicket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


// 👉 GET all tickets
router.get("/get", async (req, res) => {
  try {
    const tickets = await Support.find();
    res.json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;