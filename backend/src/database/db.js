import mongoose from "mongoose";
import configs from "../config/index.js";
import User from "../models/user.model.js";

const connectDB = async () => {
  try {
    await mongoose.connect(configs.MONGO_URI);
    console.log("Connected to database");
    await User.init();
  } catch (err) {
    console.log("Error while connecting to db: ", err);
    process.exit(1);
  }
};

export default connectDB;
