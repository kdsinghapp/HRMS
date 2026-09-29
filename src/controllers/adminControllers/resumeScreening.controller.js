import { PDFParse } from "pdf-parse";
import { analyzeResumeWithAI } from "../../services/ai.service.js";

export const analyzeResume = async (req, res) => {
  try {
    const { jobDescription } = req.body;

    if (!jobDescription?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Job description is required",
      });
    }
    

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Resume file is required",
      });
    }

    // Only PDF supported
    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({
        success: false,
        message: "Only PDF resumes are supported at the moment",
      });
    }

    // Extract text from PDF
    const parser = new PDFParse({
      data: req.file.buffer,
    });

    const result = await parser.getText();

    await parser.destroy();

    const resumeText = result.text?.trim();

    if (!resumeText) {
      return res.status(400).json({
        success: false,
        message: "Could not extract text from the provided resume",
      });
    }

    // Analyze resume using Gemini
    const aiResult = await analyzeResumeWithAI(
      resumeText,
      jobDescription.trim()
    );

    return res.status(200).json({
      success: true,
      message: "Resume analyzed successfully",
      data: aiResult,
    });
  } catch (error) {
    console.error("Resume analysis error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to analyze resume",
    });
  }
};