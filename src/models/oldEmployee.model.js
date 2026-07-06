import mongoose from "mongoose";

const { Schema } = mongoose;

/* ================= PERSONAL INFO ================= */
const personalSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    fatherName: { type: String, trim: true },
    motherName: { type: String, trim: true },
    gender: { type: String },
    maritalStatus: { type: String },
    dob: { type: Date },
    nationality: { type: String },
    bloodGroup: { type: String },
    profilePhoto: { type: String },
  },
  { _id: false },
);

/* ================= CONTACT ================= */
const contactSchema = new Schema(
  {
    primaryPhone: { type: String, trim: true },
    alternatePhone: { type: String, trim: true },
    personalEmail: { type: String, trim: true, lowercase: true },

    emergencyContact: {
      name: { type: String },
      relation: { type: String },
      phone: { type: String },
    },
  },
  { _id: false },
);

/* ================= ADDRESS ================= */
const addressSchema = new Schema(
  {
    current: {
      address: String,
      city: String,
      state: String,
      country: String,
      pincode: String,
    },
    permanent: {
      address: String,
      city: String,
      state: String,
      country: String,
      pincode: String,
    },
  },
  { _id: false },
);

/* ================= PROFESSIONAL ================= */
const professionalSchema = new Schema(
  {
    employeeId: { type: String },
    department: { type: String },
    designation: { type: String },

    employmentType: {
      type: String,
      enum: ["Full Time", "Part Time", "Hybrid", "Contract"],
    },

    status: {
      type: String,
      enum: ["Active", "Inactive", "Resigned"],
      default: "Active",
    },

    dateOfJoining: { type: Date },

    weekOffPolicy: {
      type: String,
      enum: ["FIRST_THIRD", "SECOND_FOURTH"],
    },

    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
  },
  { _id: false },
);

/* ================= ACCOUNT ================= */
const accountSchema = new Schema(
  {
    officialEmail: { type: String, trim: true, lowercase: true },

    officialPassword: { type: String }, // ✅ NEW (replace old password)
    loginPassword: { type: String }, // ✅ NEW (important)

    skypeId: { type: String },
    skypePassword: { type: String },
  },
  { _id: false },
);

/* ================= BANK ================= */
const bankSchema = new Schema(
  {
    accountHolderName: { type: String }, // ✅ NEW
    bankName: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
    branch: { type: String },
  },
  { _id: false },
);

/* ================= DOCUMENTS ================= */
const documentSchema = new Schema(
  {
    aadharCard: { type: String },
    panCard: { type: String },
    resume: { type: String },
    education: { type: String },
    experience: { type: String },
    offerLetter: { type: String },
  },
  { _id: false },
);

/* ================= MAIN EMPLOYEE SCHEMA ================= */

const employeeSchema = new Schema(
  {
    personal: personalSchema,

    contact: contactSchema,

    address: addressSchema,

    professional: professionalSchema,

    account: accountSchema,

    bank: bankSchema,

    documents: documentSchema,
    // ✅ ADD HERE (CORRECT PLACE)
    role: {
      type: String,
      enum: ["employee", "hr"],
      default: "employee",
    },
    // 🔥 ADD HERE (IMPORTANT)
    forgotPasswordToken: {
      type: String,
    },
    forgotPasswordExpiry: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

const OldEmployee = mongoose.model("OldEmployee", employeeSchema);

export default OldEmployee;
