const express = require('express');
const router = express.Router();
const {Product} = require('../models/product');
const { Category } = require("../models/category");
const nodemailer = require("nodemailer");

router.get("/", async function(req, res) {
  
  try {
    
    // Fetch all products and populate category field
    const products = await Product.find().populate("category");

    // Fetch all categories
    const categories = await Category.find();

    // Render the view, passing products, categories, and user data
    res.render("index", {
      products,
      categories,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});





router.get('/products', async (req, res) => {
  try {
    let filters = {};
    const selectedCategories = req.query.category;
    const selectedPrices = req.query.price;

    // ✅ Handle category name to ObjectId conversion
    if (selectedCategories) {
      const categoryNames = Array.isArray(selectedCategories)
        ? selectedCategories
        : [selectedCategories];

      const categoryDocs = await Category.find({ name: { $in: categoryNames } });

      const categoryIds = categoryDocs.map(cat => cat._id);
      filters.category = { $in: categoryIds };
    }

    // ✅ Handle price filters
    if (selectedPrices) {
      const priceFilters = Array.isArray(selectedPrices) ? selectedPrices : [selectedPrices];
      filters.$or = [];

      priceFilters.forEach(range => {
        if (range === '0-100') {
          filters.$or.push({ price: { $gte: 0, $lte: 100 } });
        } else if (range === '100-200') {
          filters.$or.push({ price: { $gte: 100, $lte: 200 } });
        } else if (range === '200+') {
          filters.$or.push({ price: { $gte: 200 } });
        }
      });
    }

    const products = await Product.find(filters).populate('category');
    const categories = await Category.find();

    res.render('products', {
      products,
      categories,
      selectedCategories: Array.isArray(selectedCategories) ? selectedCategories : [selectedCategories].filter(Boolean),
      selectedPrices: Array.isArray(selectedPrices) ? selectedPrices : [selectedPrices].filter(Boolean),
      totalProducts: products.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});



router.get('/products/:id', async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).send("Product not found");
  res.render('product', { product })
});







router.get("/contact", (req, res) => {
  res.render("contact");
});

router.post("/contact", async (req, res) => {
  const { name, email, message } = req.body;

  try {
    // Optionally log the data or save it to DB
    console.log("Contact Form:", { name, email, message });

    // Setup nodemailer (Google SMTP)
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS, // App password, not your Gmail password
      },
    });

    await transporter.sendMail({
      from: `"${name}" <${email}>`,
      to: process.env.GMAIL_USER, // Your receiving email
      subject: "New Contact Form Submission",
      html: `
        <h3>New Contact Request</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong><br>${message}</p>
      `,
    });

    res.render("contact", { success: "Message sent successfully!" });
  } catch (error) {
    console.error("Contact form error:", error);
    res.render("contact", { error: "Something went wrong. Please try again." });
  }
});


router.get("/faq", (req, res) => {
  res.render("faq");
});

router.get("/shipping", (req, res) => {
  res.render("shipping");
});

router.get("/track", (req, res) => {
  res.render("track");
});

module.exports = router;
