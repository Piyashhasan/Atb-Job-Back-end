import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

// --- generateAccessTokenAndRefreshToken helper ---
const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    // --- call token method ---
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    // --- save refresh token in DB ---
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.log(
      "Error from generate access token and refresh token controller ",
      error.message
    );
  }
};

// --- SIGNUP CONTROLLER ---
export const signUp = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // --- check input field values are empty or not ---
    if ([fullName, email, password].some((field) => field.trim() === "")) {
      throw new ApiError(400, "Input field values are requires");
    }

    // --- check user exist or not ---
    const existedUser = await User.findOne({ email });

    if (existedUser) {
      throw new ApiError(409, "User already exist, Please sign in");
    }

    // --- create user instance ---
    const user = await User.create({
      fullName,
      email,
      password,
    });

    // --- check user create or not ---
    const createUser = await User.findById(user?._id).select(
      "-password -refreshToken -nickName"
    );
    if (!createUser) {
      throw new ApiError(500, "Sign up failed, please try again");
    }

    res
      .status(201)
      .json(new ApiResponse(201, createUser, "Sign in successful"));
  } catch (error) {
    console.log("Error from sign up controller --", error.message);
    res.status(error.statusCode || 500).json({
      status: false,
      message: error.message,
    });
  }
};

// --- SIGNIN CONTROLLER ---
export const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    // --- check input field values are empty or not ---
    if (
      [email, password].some((field) => field.trim() === "") ||
      (!email && !password)
    ) {
      throw new ApiError(400, "Input field values are requires");
    }

    // --- check user exist or not ---
    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(409, "User not exist, Please sign up");
    }

    // --- check password correct or not ---
    const passwordValidation = await user.isCorrectPassword(password);
    if (!passwordValidation) {
      throw new ApiError(401, "Password not match.");
    }

    // --- generate accessToken and refreshToken ---
    const { accessToken, refreshToken } =
      await generateAccessTokenAndRefreshToken(user?._id);

    // --- find logged in user ---
    const loggedInUser = await User.findById(user?._id).select(
      "-password -refreshToken -createdAt -updatedAt -__v"
    );

    // --- cookie option ---
    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(200, {
          user: loggedInUser,
          accessToken: accessToken,
          refreshToken: refreshToken,
        })
      );
  } catch (error) {
    console.log("Error from sign in controller --", error.message);
    res.status(error.statusCode || 500).json({
      status: false,
      message: error.message,
    });
  }
};

// --- LOGOUT CONTROLLER ---
export const logOut = async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req?.user?._id,
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

    res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "Logout successfully"));
  } catch (error) {
    console.log("Error from logout controller", error.message);
    res.status(error.statusCode || 500).json({
      status: false,
      message: error.message,
    });
  }
};

// --- USER INFO UPDATE CONTROLLER ---
export const userInformationUpdate = async (req, res) => {
  try {
    // --- user information ---
    const id = req?.user?._id;
    const { address, nickName, phone } = req.body;

    // --- empty field validation check ---
    if (!address || !nickName || !phone) {
      throw new ApiError(400, "Input field value are required");
    }

    // --- user find ---
    const user = await User.findByIdAndUpdate(
      id,
      {
        $set: { ...req.body },
      },
      { new: true }
    ).select("-password -refreshToken");

    if (!user) {
      throw new ApiError(404, "User information update failed");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, user, "User information update successfully"));
  } catch (error) {
    console.log("Error from user information update controller", error.message);
    res.status(error.statusCode || 500).json({
      status: false,
      message: error.message,
    });
  }
};

// --- GET USER INFORMATION CONTROLLER ---
export const getUserInformation = async (req, res) => {
  try {
    const { fullName, address, nickName, phone, email } = req?.user;
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { fullName, address, nickName, phone, email },
          "User details"
        )
      );
  } catch (error) {
    console.log("Error from get user information controller", error.message);
  }
};

// --- REFRESH TOKEN GENERATE CONTROLLER ---
export const refreshTokenGenerate = async (req, res) => {
  try {
    const incomingToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingToken) {
      throw new ApiError(401, "Unauthorize request");
    }

    // --- verify token ---
    const decodedToken = jwt.verify(
      incomingToken,
      process.env.REFRESH_TOKEN_SECRETE
    );
    if (!decodedToken) {
      throw new ApiError(401, "Unauthorize token");
    }

    // --- finding user from DB ---
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    // --- cross check incoming token & user refresh token ---
    if (user?.refreshToken !== incomingToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    // --- cookies options ---
    const options = {
      httpOnly: true,
      secure: true,
    };

    // --- generate token ---
    const { accessToken, refreshToken } =
      await generateAccessTokenAndRefreshToken(user?._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken: accessToken,
            refreshToken: accessToken,
          },
          "Token value regenerate"
        )
      );
  } catch (error) {
    console.log("Error from refresh token generate controller", error.message);
  }
};
