import express from "express";
import {
  getUserInformation,
  logOut,
  refreshTokenGenerate,
  signIn,
  signUp,
  userInformationUpdate,
} from "../controllers/user.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

// --- route create ---
const userRoute = express.Router();

// --- api endpoints ---
userRoute
  .post("/sign-up", signUp)
  .post("/sign-in", signIn)
  .post("/logout", verifyJwt, logOut)
  .patch("/user-information-update", verifyJwt, userInformationUpdate)
  .get("/user-information", verifyJwt, getUserInformation);
// .post("/refresh-token-generate", refreshTokenGenerate);

// --- export user route ---
export default userRoute;
