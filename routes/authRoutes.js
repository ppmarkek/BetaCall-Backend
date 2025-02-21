import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";

const router = express.Router();

const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "5m" });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

const authCallback = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication failed" });
  }

  const accessToken = generateAccessToken(req.user.id);
  const refreshToken = generateRefreshToken(req.user.id);

  res.json({
    message: "Authentication successful",
    user: req.user,
    accessToken,
    refreshToken,
  });
};

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  authCallback
);

router.get(
  "/facebook",
  passport.authenticate("facebook", { scope: ["email"] })
);
router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { session: false }),
  authCallback
);

router.get("/twitter", passport.authenticate("twitter"));
router.get(
  "/twitter/callback",
  passport.authenticate("twitter", { session: false }),
  authCallback
);

export default router;
