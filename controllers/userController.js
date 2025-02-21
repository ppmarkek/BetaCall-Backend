import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "5m", // chacnge to 1d
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

export const createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, terms } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "A user with the same email already exists",
      });
    }

    const user = new User({
      firstName,
      lastName,
      email,
      password,
      terms,
      role: "user",
    });
    await user.save();

    res.status(201).json({ message: "User created successfully", user });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const { password: passwordHash, terms: userTerms, ...userWithoutPassword } = user.toObject();
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.json({
      message: "Authentication successful",
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};
