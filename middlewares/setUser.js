
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { User } = require("../models/user");


module.exports = async (req, res, next) => {
    // Don't overwrite if already authenticated by Passport (Google)
    if (req.user) {
      res.locals.user = req.user;
      return next();
    }
  
    // Try JWT auth
    try {
      if (req.cookies.token) {
        const decoded = jwt.verify(req.cookies.token, process.env.JWT_KEY);
        const user = await User.findById(decoded.id);
        if (user) {
          req.user = user; // ✅ Set req.user
          res.locals.user = user;
        }
      }
    } catch (err) {
      console.error("❌ JWT Auth error:", err.message);
    }
  
    next();
  };
  