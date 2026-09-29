import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import OldEmployee from "../src/models/oldEmployee.model.js";

dotenv.config();

const usersToSeed = [
  // {
  //   email: "admin@gmail.com",
  //   employeeIdCode: "AD001",
  //   fullName: "System Admin",
  //   roles: ["admin", "hr", "employee"],
  // },
  {
    email: "hr@gmail.com",
    employeeIdCode: "HR001",
    fullName: "System HR",
    roles: ["hr", "employee"],
  },
];

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    for (const seedUser of usersToSeed) {
      const existing = await OldEmployee.findOne({
        "account.officialEmail": seedUser.email,
      });

      if (existing) {
        console.log(`Skipping ${seedUser.email}, already exists.`);
        continue;
      }

      const hashedPassword = await bcrypt.hash("123456", 10);

      await OldEmployee.create({
        personal: {
          fullName: seedUser.fullName,
        },
        professional: {
          employeeId: seedUser.employeeIdCode,
          status: "Active",
        },
        account: {
          officialEmail: seedUser.email,
          loginPassword: hashedPassword,
        },
        roles: seedUser.roles,
      });

      console.log(`Seeded ${seedUser.email}`);
    }

    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error.message);
    console.error(error);
    process.exit(1);
  }
};

seedUsers();
