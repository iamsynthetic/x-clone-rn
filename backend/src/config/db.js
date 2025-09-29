import { ENV } from "./env.js";
import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(ENV.MONGO_URI);
    console.log("connected to db successfully");
  } catch (error) {
    console.log("error connecting to mongodb");
    process.exit(1);
  }
};
