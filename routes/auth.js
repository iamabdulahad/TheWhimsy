const express = require('express');
const passport = require('passport');
const router = express.Router();

// STEP 1: Google Auth Start
router.get("/google", passport.authenticate("google", {
    scope: ["profile", "email"]
}));

// STEP 2: Google Callback
router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", (err, user, info) => {
    if (err || !user) return res.redirect("/");

    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.redirect("/");
    });
  })(req, res, next);
});

// Logout
router.get("/logout", function(req, res ,next) {
  req.logout(function(err) {
      if(err){
          return next(err);
      }
      res.redirect("/");
  });
});

module.exports = router;
