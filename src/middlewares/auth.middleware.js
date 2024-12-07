import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const verifyJwt = async (req, res, next) => {
  try {
    const accessToken =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    const refreshToken = req.cookies.refreshToken;

    //   --- if accessToken not exist ---
    if (!accessToken)
      return res.status(401).json({ message: "Access token required" });

    //   --- verify accessToken value ---
    jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRETE,
      async (err, decoded) => {
        if (!err) {
          const user = await User.findById(decoded?._id);
          if (!user) {
            throw new ApiError(401, "Invalid access token");
          }
          req.user = user;

          next();
        } else if (err.name === "TokenExpiredError") {
          // accessToken expire now verify refresh token
          if (!refreshToken) {
            throw new ApiError(401, "Unauthorize request");
          }

          // verify refresh token
          jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRETE,
            async (err, decoded) => {
              if (!err) {
                return res
                  .status(200)
                  .json(new ApiResponse(200, "regenerate-refresh-token"));
              }

              if (err) {
                // refresh token also expired
                const user = await User.findOne({ refreshToken });

                if (!user) {
                  throw new ApiError(401, "Invalid refresh token");
                }

                await User.findByIdAndUpdate(
                  user?._id,
                  {
                    $unset: { refreshToken: 1 },
                  },
                  { new: true }
                );

                // --- cookie options ---
                const options = {
                  httpOnly: true,
                  secure: true,
                };

                return res
                  .status(200)
                  .clearCookie("accessToken", options)
                  .clearCookie("refreshToken", options)
                  .json(new ApiResponse(200, {}, "Please login again"));
              }
            }
          );
        } else {
          return res.status(403).json({ message: "Invalid access token" });
        }
      }
    );
  } catch (error) {
    console.log("Error from verify jwt function -", error);
  }
};
