import express from "express";
import { ENV } from "./config/env.js";
import { connectDB } from "./config/db.js";

const app = express();

connectDB();

app.get("/", (req, res) => res.send("hello from server"));

app.listen(ENV.API_URL, () =>
  console.log(`server is up and running on ${ENV.API_URL}`),
);
