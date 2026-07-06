import Interview from "../../models/interview.model.js";
import Visitor from "../../models/Visitor.js";
import Employee from "../../models/employee.model.js";
import OldEmployee from './../../models/oldEmployee.model.js';

/* ================= ROUND ORDER ================= */
const roundOrder = ["HR", "Technical", "Machine Coding", "Director", "Salary Discussion","Document Verification","Joining Form",];

/* ============================================================
   1️⃣ SCHEDULE INTERVIEW
============================================================ */
export const scheduleInterview = async (req, res) => {
  try {
    const {
      candidateId,
      roundType,
      interviewerId,
      interviewDate,
      interviewTime,
    } = req.body;

    /* ================= BASIC VALIDATION ================= */
    if (
      !candidateId ||
      !roundType ||
      !interviewerId ||
      !interviewDate ||
      !interviewTime
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    /* ================= COMBINE DATE + TIME ================= */
  const [year, month, day] = interviewDate
  .split("-")
  .map(Number);

const [hours, minutes] = interviewTime
  .split(":")
  .map(Number);

/*
User selects IST
Convert IST -> UTC before saving
IST = UTC + 5:30
*/
const scheduledDate = new Date(
  Date.UTC(
    year,
    month - 1,
    day,
    hours - 5,
    minutes - 30,
    0
  )
);

    /* ================= PAST DATE CHECK ================= */
    if (scheduledDate < new Date()) {
      return res.status(400).json({
        message: "Cannot schedule interview in the past",
      });
    }

    /* ================= SUNDAY BLOCK ================= */
    if (scheduledDate.getDay() === 0) {
      return res.status(400).json({
        message: "Sunday scheduling not allowed",
      });
    }

    /* ================= OFFICE TIMING CHECK ================= */
    const hour = scheduledDate.getHours();
    if (hour < 10 || hour >= 19) {
      return res.status(400).json({
        message: "Interview must be between 10 AM and 7 PM",
      });
    }

    /* ================= CANDIDATE CHECK ================= */
    const candidate = await Visitor.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({
        message: "Candidate not found",
      });
    }

    /* ================= INTERVIEWER CHECK ================= */
    const interviewer = await Employee.findById(interviewerId) || await OldEmployee.findById(interviewerId);
    if (!interviewer) {
      return res.status(404).json({
        message: "Invalid interviewer",
      });
    }

    /* ================= PREVIOUS ROUND CHECK ================= */
    const lastInterview = await Interview.findOne({
      candidate: candidateId,
    }).sort({ createdAt: -1 });

    if (lastInterview) {
      if (lastInterview.status !== "completed") {
        return res.status(400).json({
          message: "Previous round not completed",
        });
      }

      if (!["hire", "strong_hire"].includes(lastInterview.recommendation)) {
        return res.status(400).json({
          message: "Candidate not recommended for next round",
        });
      }

      const lastIndex = roundOrder.indexOf(lastInterview.roundType);
      const nextExpected = roundOrder[lastIndex + 1];

      if (!nextExpected) {
        return res.status(400).json({
          message: "All rounds already completed",
        });
      }

      if (roundType !== nextExpected) {
        return res.status(400).json({
          message: `Next allowed round is ${nextExpected}`,
        });
      }
    } else {
      if (roundType !== "HR") {
        return res.status(400).json({
          message: "First round must be HR",
        });
      }
    }

    /* ================= CREATE INTERVIEW ================= */
   const interview = await Interview.create({
  candidate: candidateId,
  roundType,
  interviewer: interviewerId,
  scheduledDate,
  interviewTime
});
    // const interview = await Interview.create({
    //   candidate: candidateId,
    //   roundType,
    //   interviewer: interviewerId,
    //   scheduledDate,
    // });

    return res.status(201).json({
      success: true,
      message: "Interview scheduled successfully",
      interview,
    });

  } catch (error) {
    console.error("Schedule Interview Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* ============================================================
   2️⃣ COMPLETE INTERVIEW
============================================================ */
export const completeInterview = async (req, res) => {
  try {
    const { interviewId } = req.params
    const { rating, feedback, recommendation } = req.body;

    const interview = await Interview.findById(interviewId);
     if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    if (interview.status === "completed") {
      return res.status(400).json({
        message: "Interview already completed",
      });
    }

    interview.status = "completed";
    interview.rating = rating;
    interview.feedback = feedback;
    interview.recommendation = recommendation;

    await interview.save();

    return res.json({
      success: true,
      message: "Interview completed successfully",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* ============================================================
   3️⃣ CANCEL INTERVIEW
============================================================ */
export const cancelInterview = async (req, res) => {
  try {
    const { interviewId, reason } = req.body;

    const interview = await Interview.findById(interviewId);

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    interview.status = "cancelled";
    interview.cancelledReason = reason;

    await interview.save();

    return res.json({
      success: true,
      message: "Interview cancelled",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* ============================================================
   4️⃣ GET CANDIDATE INTERVIEWS
============================================================ */
export const getCandidateInterviews = async (req, res) => {
  try {
    const { candidateId } = req.params;

    const interviews = await Interview.find({ candidate: candidateId })
      .populate("interviewer", "name email")
      .sort({ createdAt: 1 });

    return res.json({
      success: true,
      interviews,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* ================= INTERVIEWER DASHBOARD ================= */
export const getInterviewerInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({
      interviewer: req.params.employeeId,
    })
      .populate("candidate", "fullName technology currentStage")
      .sort({ scheduledDate: 1 });

    res.json(interviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* ================= CANDIDATE SUMMARY ================= */
// export const getCandidateInterviews = async (req, res) => {
//   try {
//     const candidate = await Visitor.findById(req.params.candidateId);

//     if (!candidate) {
//       return res.status(404).json({ message: "Candidate not found" });
//     }

//     const interviews = await Interview.find({
//       candidate: req.params.candidateId,
//     })
//       .populate("interviewer", "name role")
//       .sort({ createdAt: 1 });

//     res.json({
//       candidate: {
//         name: candidate.fullName,
//         technology: candidate.technology,
//         status: candidate.applicationStatus,
//         averageRating: candidate.averageRating,
//         currentStage: candidate.currentStage,
//       },
//       interviews,
//     });

//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };


//========================================//



export const getCandidateSummary = async (req, res) => {
  try {
    const candidate = await Visitor.findById(req.params.candidateId);

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    const interviews = await Interview.find({
      candidate: candidate._id,
    })
      .populate("interviewer", "name role")
      .sort({ createdAt: 1 });

    const averageRating =
      interviews.reduce((acc, curr) => acc + (curr.rating || 0), 0) /
      (interviews.length || 1);

    res.json({
      candidate: {
        name: candidate.fullName,
        technology: candidate.technology,
        status: candidate.applicationStatus,
        currentStage: candidate.currentStage,
      },
      interviews,
      averageRating: averageRating.toFixed(1),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};