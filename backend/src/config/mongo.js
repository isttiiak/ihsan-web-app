import mongoose from "mongoose";

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not set");
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, {
    dbName: "ihsan",
    autoIndex: true,
  });
  if (process.env.NODE_ENV !== "test") {
    console.log("MongoDB connected");
  }
};
