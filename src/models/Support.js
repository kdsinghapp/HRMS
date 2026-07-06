import mongoose from "mongoose";

const supportSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    category: String,
    message: String,
    id: Number,
  },
  { timestamps: true }
);

export default mongoose.model("Support", supportSchema);