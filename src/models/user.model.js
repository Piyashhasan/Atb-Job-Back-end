import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      trim: true,
      required: [true, "Full name is required"],
    },
    nickName: {
      type: String,
      default: "N/A",
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "password is required"],
      unique: true,
    },
    address: {
      type: String,
      trim: true,
    },
    phone: {
      type: Number,
      trim: true,
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

// --- password hash ---
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// --- password isCorrect or not check ---
userSchema.methods.isCorrectPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// --- generate accessToken ---
userSchema.methods.generateAccessToken = function () {
  const accessToken = jwt.sign(
    {
      _id: this._id,
      fullName: this.fullName,
      email: this.email,
    },
    process.env.ACCESS_TOKEN_SECRETE,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRE,
    }
  );

  return accessToken;
};

// --- generate refreshToken ---
userSchema.methods.generateRefreshToken = function () {
  const refreshToken = jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRETE,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRE,
    }
  );

  return refreshToken;
};

// --- export User model ---
export const User = mongoose.model("User", userSchema);
