import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const employeeSchema = new mongoose.Schema(
  {
    /* ================= AUTH ================= */

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["employee", "hr", "admin"],
      default: "employee",
      index: true,
    },

    /* ================= HR CONTROLLED ================= */

    employeeCode: {
      type: String,
      unique: true,
      sparse: true,
      default: null,
    },

    department: { type: String, default: null },
    designation: { type: String, default: null },
    dateOfJoining: { type: Date, default: null },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },

    approvedAt: { type: Date, default: null },

    salaryStructureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalaryStructure",
      default: null,
    },

    /* ================= EMPLOYEE DATA ================= */

    name: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, default: null },
    contactNo: { type: String, default: null },
    personalEmail: { type: String, lowercase: true, trim: true, default: null },
    currentAddress: { type: String, default: null },
    permanentAddress: { type: String, default: null },
    emergencyNo: { type: String, default: null },

    /* ================= STATUS ================= */

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    isActive: {
      type: Boolean,
      default: false,
      index: true,
    },

    emailVerified: { type: Boolean, default: false },
    emailOTP: { type: Number, default: null },
    emailOTPExpiry: { type: Date, default: null },

    forgotPasswordToken: { type: String, default: null },
    forgotPasswordExpiry: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual properties for requirements compatibility
employeeSchema.virtual("employeeId").get(function () {
  return this.employeeCode;
});

employeeSchema.virtual("joiningDate").get(function () {
  return this.dateOfJoining;
});


/* ================= PASSWORD HASHING ================= */

employeeSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/* ================= PASSWORD COMPARE ================= */

employeeSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/* ================= SAFE MODEL EXPORT ================= */

const Employee =
  mongoose.models.Employee ||
  mongoose.model("Employee", employeeSchema);

export default Employee;