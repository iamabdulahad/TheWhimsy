const GoogleStrategy = require("passport-google-oauth20").Strategy;
const LocalStrategy = require("passport-local").Strategy;
const { User } = require("../models/user");
const passport = require("passport");
const bcrypt = require("bcryptjs"); // Needed for local password compare
require("dotenv").config();

// 🔹 Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    async function (accessToken, refreshToken, profile, cb) {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          user = new User({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
          });

          await user.save();
        }

        return cb(null, user);
      } catch (err) {
        return cb(err, false);
      }
    }
  )
);

// 🔹 Local Strategy (for email + password)
passport.use(
  new LocalStrategy(
    { usernameField: "email" }, // we are using email, not username
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email });
        if (!user) return done(null, false, { message: "No user found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return done(null, false, { message: "Incorrect password" });

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// 🔹 Session Handling
passport.serializeUser((user, cb) => cb(null, user._id));

passport.deserializeUser(async (id, cb) => {
  try {
    
    const user = await User.findById(id);
    cb(null, user);
  } catch (err) {
    cb(err, null);
  }
});




module.exports = passport;
