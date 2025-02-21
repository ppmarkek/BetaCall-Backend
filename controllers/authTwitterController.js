import { TwitterApi } from "twitter-api-v2";
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

const client = new TwitterApi({
  clientId: process.env.TWITTER_CLIENT_ID,
  clientSecret: process.env.TWITTER_CLIENT_SECRET,
});

const callbackURL = "http://localhost:3000/auth/twitter/callback";

export const twitterLogin = async (req, res) => {
  try {
    const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
      callbackURL,
      { scope: ["tweet.read", "users.read", "offline.access"] }
    );

    return res.json({ url, codeVerifier, state });
  } catch (err) {
    console.error("Twitter Login Error:", err);
    return res.status(500).json({ message: "Error generating Twitter link" });
  }
};

export const twitterCallback = async (req, res) => {
  try {
    const { state, code, codeVerifier } = req.query;

    const {
      client: loggedClient,
      accessToken,
      refreshToken,
      expiresIn,
    } = await client.loginWithOAuth2({
      code,
      codeVerifier,
      redirectUri: callbackURL,
    });

    const { data: userData } = await loggedClient.v2.me();

    let user = await User.findOne({ twitterId: userData.id });
    if (!user) {
      user = new User({
        twitterId: userData.id,
        firstName: userData.name,
      });
      await user.save();
    }

    const jwtAccessToken = generateAccessToken(user._id);
    const jwtRefreshToken = generateRefreshToken(user._id);

    const userObj = user.toObject();
    delete userObj.password;

    return res.json({
      message: "Twitter login successful",
      user: userObj,
      accessToken: jwtAccessToken,
      refreshToken: jwtRefreshToken,
    });
  } catch (err) {
    console.error("Twitter Callback Error:", err);
    return res.status(500).json({ message: "Error during Twitter callback" });
  }
};
