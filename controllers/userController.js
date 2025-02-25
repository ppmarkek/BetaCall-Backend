import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";

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
    const { firstName, lastName, email, password, appwriteId, terms } =
      req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "A user with the same email already exists",
      });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpires = Date.now() + 3600000;
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      terms,
      appwriteId,
      role: "user",
      verificationToken,
      verificationTokenExpires,
    });

    await user.save();

    const verificationUrl = `${process.env.FRONTEND_URL}/verify/token/${verificationToken}?email=${email}`;

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      to: email,
      subject: "Account verification",
      html: `
        <p>Hello, ${firstName}! To confirm your account, follow this link:</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
      `,
    });

    res.status(201).json({ message: "User created, verify email sent." });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ message: "User with this email not found." });
    }

    if (user.verified) {
      return res
        .status(400)
        .json({ message: "The account has already been verified" });
    }

    user.verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationTokenExpires = Date.now() + 3600000;
    await user.save();

    const verificationUrl = `${process.env.FRONTEND_URL}/resetPassword/${user.verificationToken}?email=${email}`;

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      to: email,
      subject: "Resending account verification",
      html: `
        <p>Hello, ${user.firstName}! To confirm your account, follow this link:</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
      `,
    });

    res.json({ message: "The letter has been resent." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "The link is invalid or expired" });
    }

    user.verified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;

    await user.save();

    res.json({ message: "Account verified successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.verified) {
      return res.status(403).json({ message: "Account not verified." });
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
        if (!user.verified) {
          return res.status(403).json({ message: "Account not verified." });
        }
        if (!user.appwriteId) {
          user.appwriteId = appwriteId;
          await user.save();
        }
      } else {
        return res.status(404).json({ message: "User not found" });
      }
    }

    if (!user.verified) {
      return res.status(403).json({ message: "Account not verified." });
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

export const resetPassword = async (req, res) => {
  try {
    const { email, password, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "User with this email not found." });
    }

    if (!user.verified) {
      return res.status(400).json({ message: "Account is not verified." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid current password." });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.json({ message: "Password updated successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const requestResetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ message: "User with this email not found." });
    }

    if (!user.verified) {
      return res.status(400).json({ message: "Account is not verified." });
    }

    user.resetPasswordToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/verify/token/${user.resetPasswordToken}?email=${email}`;

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      to: email,
      subject: "Password reset request",
      html: `
        <p>Hello, ${user.firstName}!</p>
        <p>You have requested a password reset. To do this, click on the link below:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>If you did not request a password reset, simply ignore this email.</p>
      `,
    });

    res.json({ message: "The letter has been resent." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const tokenResetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired password reset token.",
      });
    }

    if (!user.verified) {
      return res.status(400).json({ message: "Account is not verified." });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: "Password updated successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
