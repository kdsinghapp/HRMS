import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

// Initialize the GoogleGenAI client if API key is present
const ai = process.env.AI_API_KEY ? new GoogleGenAI({ apiKey: process.env.AI_API_KEY }) : null;

/**
 * Analyzes a resume against a job description using Gemini.
 * @param {string} resumeText - Extracted text from the candidate's resume
 * @param {string} jobDescription - Job description provided by HR
 * @returns {Promise<Object>} - Structured JSON analysis
 */
export const analyzeResumeWithAI = async (resumeText, jobDescription) => {
  if (!ai) {
    throw new Error("AI API Key not configured. Please set AI_API_KEY in environment variables.");
  }

  const prompt = `
You are an expert HR AI Assistant. Your task is to analyze the following candidate resume against the provided job description and evaluate their fit. 
Do NOT make decisions based on sensitive or discriminatory personal attributes (race, religion, gender, ethnicity, age, etc.).

Resume Text:
${resumeText}

Job Description:
${jobDescription}

Evaluate the candidate based on skills, experience, education, certifications, responsibilities, and relevant achievements.
Provide your response strictly adhering to the JSON schema requested.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            matchScore: {
              type: "INTEGER",
              description: "Overall match score percentage (0-100)",
            },
            recommendation: {
              type: "STRING",
              description: "Recommendation: Strong Match, Good Match, Partial Match, Weak Match, or Not Recommended",
            },
            matchedSkills: {
              type: "ARRAY",
              items: { type: "STRING" },
              description: "List of skills from the JD that the candidate possesses",
            },
            missingSkills: {
              type: "ARRAY",
              items: { type: "STRING" },
              description: "List of skills from the JD that the candidate is missing",
            },
            experienceMatch: {
              type: "OBJECT",
              properties: {
                score: { type: "INTEGER" },
                summary: { type: "STRING" },
              },
            },
            educationMatch: {
              type: "OBJECT",
              properties: {
                score: { type: "INTEGER" },
                summary: { type: "STRING" },
              },
            },
            strengths: {
              type: "ARRAY",
              items: { type: "STRING" },
            },
            gaps: {
              type: "ARRAY",
              items: { type: "STRING" },
            },
            summary: {
              type: "STRING",
              description: "A concise HR-friendly explanation of whether the candidate should proceed to the next stage.",
            },
          },
          required: [
            "matchScore",
            "recommendation",
            "matchedSkills",
            "missingSkills",
            "experienceMatch",
            "educationMatch",
            "strengths",
            "gaps",
            "summary",
          ],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    } else {
      throw new Error("Empty response from AI");
    }
  } catch (error) {
    console.error("AI Service Error:", error);
    throw new Error("Failed to analyze resume with AI.");
  }
};
