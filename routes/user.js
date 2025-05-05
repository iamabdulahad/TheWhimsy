// 🔐 Load environment variables & required modules
require("dotenv").config();
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { User } = require("../models/user");
const jwt = require("jsonwebtoken");
const axios = require("axios")
const nodemailer = require("nodemailer");


// 📄 Render Login Page
router.get("/login", (req, res) => {
    res.render("user_login")
});


// 📄 Render Profile Page (Only for logged-in users)
router.get("/profile", (req, res) => {
    if (!req.user) return res.redirect("/users/login");
    res.render("profile", { user: req.user });
});


// 📦 Update User Address
router.post("/profile/address", async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { street, city, state, zipCode, country, phone } = req.body;

        if (!street || !city || !state || !zipCode) {
            return res.status(400).json({ error: "All address fields are required" });
        }

        const user = await User.findOne({ email: req.user.email });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (phone) user.phone = phone;

        const newAddress = {
            street,
            city,
            state,
            zipCode,
            country: country || "India",
        };

        if (user.addresses.length > 0) {
            user.addresses[0] = newAddress;
        } else {
            user.addresses.push(newAddress);
        }

        await user.save();
        res.redirect("/users/profile");
    } catch (err) {
        console.error("Error updating address:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// 📄 Render Registration Page
router.get('/register', (req, res) => {
  res.render('user_register', { 
    recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY,
    error: [],
    name: '',
    email: '',
    phone: ''
  });
});


// 📝 Register New User
router.post("/register", async (req, res) => {
  const { email, password, name, phone, confirmPassword } = req.body;
  const token = req.body["g-recaptcha-response"];

  // ✅ reCAPTCHA token check
  if (!token) {
    return res.render("user_register", {
      error: ["Please verify you are not a robot"],
      name,
      email,
      phone,
      recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY
    });
  }

  // ✅ Verify reCAPTCHA token with Google
  try {
    const response = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: token
        }
      }
    );

    // console.log("reCAPTCHA verification result:", response.data);
    // console.log("Form Data:", req.body);


    const data = response.data;
    if (!data.success || data.score < 0.5) {
      return res.render("user_register", {
        error: ["Suspicious activity detected. Please try again."],
        name,
        email,
        phone,
        recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY
      });
    }
  } catch (err) {
    // console.error("reCAPTCHA Error:", err);
    return res.render("user_register", {
      error: ["reCAPTCHA verification failed. Try again later."],
      name,
      email,
      phone,
      recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY
    });
  }

  // ✅ Field Validation
  if (!email || !password || !name || !phone || !confirmPassword) {
    return res.render("user_register", {
      error: ["All fields are required"],
      name,
      email,
      phone,
      recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY
    });
  }

  if (password !== confirmPassword) {
    return res.render("user_register", {
      error: ["Passwords do not match"],
      name,
      email,
      phone,
      recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY
    });
  }

  // ✅ Register user
  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.render("user_register", {
        error: ["User already exists"],
        name,
        email,
        phone,
        recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      phone,
      password: hashedPassword
    });

    await newUser.save();

    req.flash("success", "Account created successfully! Please log in.");
    return res.redirect("/users/login");
  } catch (err) {
    console.error("Registration Error:", err);
    let errorMessage = "Something went wrong. Please try again.";
    if (err.name === "ValidationError") {
      errorMessage = Object.values(err.errors).map(e => e.message).join(", ");
    }

    return res.render("user_register", {
      error: [errorMessage],
      name,
      email,
      phone,
      recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY
    });
  }
});



// 🔓 Login User & Generate JWT Token
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user || !user.password) {
            req.flash("error", "Invalid credentials");
            return res.redirect("/users/login");
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            req.flash("error", "Invalid credentials");
            return res.redirect("/users/login");
        }

        const remember = req.body.remember === "on";

        const token = jwt.sign(
            { id: user._id, name: user.name },
            process.env.JWT_KEY,
            { expiresIn: remember ? "7d" : "1d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
            maxAge: remember ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
        });

        res.redirect("/");
    } catch (err) {
        console.error("Login Error:", err);
        req.flash("error", "Something went wrong");
        res.redirect("/users/login");
    }
});


// 🔑 Show Forgot Password Page
router.get("/forgot-password", (req, res) => {
    res.render("forgot_password", { messages: req.flash() });
});



const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false, // use TLS
  auth: {
    user: process.env.BREVO_EMAIL,     // your brevo email
    pass: process.env.BREVO_SMTP_KEY,  // your brevo SMTP key
  },
});

async function sendResetEmail(to, resetLink) {
  try {
    await transporter.sendMail({
      from: `"Candy Shop" <${process.env.BREVO_EMAIL}>`,
      to,
      subject: "Reset your password",
      html: `
        <h2>Password Reset</h2>
        <p>Click below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link will expire in 15 minutes.</p>
      `,
    });

    console.log("Reset email sent to", to);
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}


// 📩 Send Reset Password Link via JWT Token
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            req.flash("error", "No user found with this email.");
            return res.redirect("/users/forgot-password");
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_KEY, { expiresIn: "15m" });

        user.resetToken = token;
        user.resetTokenExpiry = Date.now() + 15 * 60 * 1000;
        await user.save();

        const resetLink = `http://localhost:3000/users/reset-password/${token}`;
        await sendResetEmail(user.email, resetLink);

        

        console.log("Reset Link:", resetLink);

        req.flash("success", "Password reset link has been sent to your email.");
        res.redirect("/users/forgot-password");
    } catch (err) {
        console.error("Error in forgot-password:", err);
        req.flash("error", "Something went wrong.");
        res.redirect("/users/forgot-password");
    }
});


// 🔐 Show Reset Password Page
router.get("/reset-password/:token", (req, res) => {
    const { token } = req.params;
    res.render("reset_password", { token });
});


// 🔐 Handle New Password Submission
router.post("/reset-password/:token", async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_KEY);

        const user = await User.findOne({
            _id: decoded.id,
            resetToken: token,
            resetTokenExpiry: { $gt: Date.now() },
        });

        if (!user) {
            req.flash("error", "Invalid or expired reset token");
            return res.redirect("/users/forgot-password");
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();

        req.flash("success", "Password updated successfully");
        res.redirect("/users/login");
    } catch (err) {
        console.error(err);
        req.flash("error", "Something went wrong");
        res.redirect("/users/forgot-password");
    }
});


// 🚪 Logout User (also handles Google session)
router.get("/logout", (req, res, next) => {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }

        req.session?.destroy(function (err) {
            if (err) {
                return next(err);
            }

            res.clearCookie("token");
            res.clearCookie("connect.sid");
            res.redirect("/");
        });
    });
});



module.exports = router;
