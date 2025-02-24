import User from "../models/User.js";
import jwt from "jsonwebtoken";

export const isAuthenticated = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (!decoded.userId || !decoded.userId._id) {
        return res
          .status(401)
          .json({ message: "Invalid authentication token." });
      }

      req.user = await User.findById(decoded.userId._id).select("-password");

      if (!req.user) {
        return res.status(404).json({ message: "User not found." });
      }

      next();
    } catch (err) {
      console.error("JWT Verification Error:", err);
      res.status(401).json({ message: "Invalid authentication token." });
    }
  } else {
    res.status(401).json({ message: "No authentication token provided." });
  }
};

const isVerified = async (req, res, next) => {
  
};