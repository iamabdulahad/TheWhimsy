const express = require('express');
const router = express.Router();
const {Product} = require('../models/product');
const { Category } = require("../models/category");

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
router.get("/products", async (req, res) => {
  const { price } = req.query;

  let filter = {};
  let selectedPrices = [];

  if (price) {
    selectedPrices = Array.isArray(price) ? price : [price];

    const priceConditions = selectedPrices.map((range) => {
      if (range === "0-100") return { price: { $gte: 0, $lte: 100 } };
      if (range === "100-200") return { price: { $gte: 100, $lte: 200 } };
      if (range === "200+") return { price: { $gt: 200 } };
    }).filter(Boolean);

    if (priceConditions.length) {
      filter.$or = priceConditions;
    }
  }

  const products = await Product.find(filter);

  // ✅ Ensure selectedPrices is always passed
  res.render("products", {
    products,
    selectedPrices, // even if it's empty
  });
});




router.get('/products/:id', async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).send("Product not found");
  res.render('product', { product })
});







router.get("/contact", (req, res) => {
  res.render("contact");
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
