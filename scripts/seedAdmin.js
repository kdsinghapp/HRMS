import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import OldEmployee from "../src/models/oldEmployee.model.js";

dotenv.config();

const seedAdmin = async () => {
  try {
    // connect DB
    await mongoose.connect(process.env.MONGO_URI);

    const existingAdmin = await OldEmployee.findOne({
      "account.officialEmail": "hr@gmail.com",
    });

    if (existingAdmin) {
      console.log("⚠️ Admin already exists");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("123456", 10);

    await OldEmployee.create({
      personal: {
        fullName: "System Admin",
      },
      professional: {
        employeeId: "HR001",
        status: "Active",
      },
      account: {
        officialEmail: "hr@gmail.com",
        loginPassword: hashedPassword,
      },
      role: "hr",
    });

    console.log("✅ Admin created successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Admin seed failed:", error.message);
    process.exit(1);
  }
};

seedAdmin();
