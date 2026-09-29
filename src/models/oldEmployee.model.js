import mongoose from "mongoose";

const { Schema } = mongoose;

// PERSONAL INFO
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

// CONTACT
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

// ADDRESS
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

// PROFESSIONAL
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

// IDENTIFICATION
const identificationSchema = new Schema(
  {
    aadhaarNo: { type: String, trim: true },
    pan: { type: String, trim: true, uppercase: true },
    esic: { type: String, trim: true },
    uan: { type: String, trim: true },
    idNo: { type: String, trim: true },
  },
  { _id: false },
);

// ACCOUNT
const accountSchema = new Schema(
  {
    officialEmail: { type: String, trim: true, lowercase: true },
    officialPassword: { type: String },
    loginPassword: { type: String },
    teamsId: { type: String },
    teamsPassword: { type: String },
  },
  { _id: false },
);

// BANK
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

// DOCUMENTS
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

// MAIN EMPLOYEE SCHEMA

const employeeSchema = new Schema(
  {
    personal: personalSchema,

    contact: contactSchema,

    address: addressSchema,

    professional: professionalSchema,

    identification: identificationSchema,

    account: accountSchema,

    bank: bankSchema,

    documents: documentSchema,

    // ✅ MULTI-ROLE ACCESS
    // Single source of truth for access control. A user can hold more than
    // one role at the same time (e.g. an HR user is also an employee, and
    // Admin has access to all three sides). No separate "double dashboard"
    // flag/permission exists anywhere else — everything is derived from
    // this array.
    //   - Employee created by HR        -> ["employee"]
    //   - HR seeded                     -> ["hr", "employee"]
    //   - Admin seeded                  -> ["admin", "hr", "employee"]
    roles: {
      type: [String],
      enum: ["employee", "hr", "admin"],
      default: ["employee"],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "At least one role is required",
      },
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
