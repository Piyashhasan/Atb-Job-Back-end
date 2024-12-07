import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoute from "./routes/user.route.js";

// --- initialize app ---
const app = express();

// --- middleware ---
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// --- user api route ---
app.use("/api/v1/user", userRoute);

// --- root route ---
app.get("/", (req, res) => {
  res.status(200).json({
    status: true,
    message: "Server is running",
  });
});

// --- export app ---
export default app;
