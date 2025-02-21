import axios from "axios";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "5m" });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

export const facebookLogin = async (req, res) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) {
      return res
        .status(400)
        .json({ message: "No Facebook access token provided" });
    }

    const fbRes = await axios.get(
      `https://graph.facebook.com/me?fields=id,email,first_name,last_name&access_token=${accessToken}`
    );

    const { id: facebookId, email, first_name, last_name } = fbRes.data;

    let user = await User.findOne({
      $or: [{ facebookId }, { email }],
    });

    if (!user) {
      user = new User({
        facebookId,
        email,
        firstName: first_name,
        lastName: last_name,
      });
      await user.save();
    }

    const accessTokenJWT = generateAccessToken(user._id);
    const refreshTokenJWT = generateRefreshToken(user._id);

    const userObj = user.toObject();
    delete userObj.password;

    return res.json({
      message: "Facebook login successful",
      user: userObj,
      accessToken: accessTokenJWT,
      refreshToken: refreshTokenJWT,
    });
  } catch (err) {
    console.error("Facebook Login Error:", err);
    return res
      .status(500)
      .json({ message: "Server error during Facebook login" });
  }
};
