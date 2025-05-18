// middlewares/userLoggin.js

function userIsLoggedIn(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next(); // Allow access
    }

    // Redirect to login with optional redirect back to original URL
    return res.redirect("/users/login?redirect=" + req.originalUrl);
}

module.exports = userIsLoggedIn;
