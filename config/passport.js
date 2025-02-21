import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { Strategy as TwitterStrategy } from "passport-twitter";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

const authenticateOAuth = async (profile, provider, done) => {
  try {
    let user = await User.findOne({ [`${provider}Id`]: profile.id });

    if (!user) {
      user = new User({
        [`${provider}Id`]: profile.id,
        firstName: profile.name?.givenName || profile.displayName,
        lastName: profile.name?.familyName || "",
        email: profile.emails?.[0]?.value || "",
        avatar: profile.photos?.[0]?.value || "",
      });
      await user.save();
    }
    done(null, user);
  } catch (err) {
    done(err, null);
  }
};

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) =>
      authenticateOAuth(profile, "google", done)
  )
);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: "/auth/facebook/callback",
      profileFields: [
        "id",
        "displayName",
        "email",
        "first_name",
        "last_name",
        "picture.type(large)",
      ],
    },
    (accessToken, refreshToken, profile, done) =>
      authenticateOAuth(profile, "facebook", done)
  )
);

passport.use(
  new TwitterStrategy(
    {
      consumerKey: process.env.TWITTER_CONSUMER_KEY,
      consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
      callbackURL: "/auth/twitter/callback",
      includeEmail: true,
    },
    (token, tokenSecret, profile, done) =>
      authenticateOAuth(profile, "twitter", done)
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
