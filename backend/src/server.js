import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import userRoutes from "./routes/user.route.js";
import postRoutes from "./routes/post.route.js";

import { ENV } from "./config/env.js";
import { connectDB } from "./config/db.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());
app.get("/", (req, res) => res.send("hello from server"));

app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);

app.use((err, req, res) => {
  console.error("unhandled error:", err);
  res.stastus(500).json({ error: err.message || "internal server error" });
});

const startServer = async () => {
  try {
    await connectDB();

    // listen for local development
    if (ENV.NODE_ENV !== "production") {
      app.listen(ENV.API_URL, () =>
        console.log("Server is up and running on PORT:", ENV.API_URL),
      );
    }
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
