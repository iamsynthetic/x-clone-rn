import express from "express";
import "dotenv/config";

const app = express();
const API_URL = process.env.API_URL || 5001;
app.listen(API_URL, () =>
  console.log(`server is up and running on ${API_URL}`),
);
