import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    const conn = await mongoose.connect(mongoURI, {
      autoIndex: false, // production ke liye better
      serverSelectionTimeoutMS: 5000,
    });

    console.log(
      `✅ MongoDB Connected successfully`
    );
  } catch (error) {
    console.error("❌ MongoDB connection failed");
    console.error(error.message);

    // production-grade apps me process exit kar dete hain
    process.exit(1);
  }
};

export default connectDB;
