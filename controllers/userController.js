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

export const getUsers = async (_req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, googleId, terms } = req.body;

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
      googleId,
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

    const {
      password: passwordHash,
      terms: userTerms,
      googleId: userGoogleId,
      facebookId: userFacebookId,
      twitterId: userTwitterId,
      ...userWithoutPassword
    } = user.toObject();
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

export const loginWithAppwriteAccount = async (req, res) => {
  try {
    const { appwriteId, email } = req.body;
    let user = await User.findOne({ appwriteId });

    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        if (!user.appwriteId) {
          user.appwriteId = appwriteId;
          await user.save();
        }
      } else {
        return res.status(404).json({ message: "User not found" });
      }
    }

    const {
      password: passwordHash,
      terms: userTerms,
      appwriteId: userAppwriteId,
      ...userWithoutPassword
    } = user.toObject();

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

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ message: "Refresh token is required" });

    jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET,
      async (err, decoded) => {
        if (err)
          return res.status(403).json({ message: "Invalid refresh token" });

        const newAccessToken = generateAccessToken(decoded.userId);
        res.json({ accessToken: newAccessToken });
      }
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
