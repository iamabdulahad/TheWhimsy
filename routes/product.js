const express = require('express');
const mongoose = require("mongoose");
const router = express.Router();
const { Product } = require("../models/product");
const { Category } = require("../models/category"); // ✅ required for dropdown
const upload = require("../config/multer_config");
const fs = require('fs');
const cloudinary = require('../config/cloudinary');
const validateAdmin = require('../middlewares/admin');




// ✅ Show product form with category dropdown

router.get("/new", async function(req, res) {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.render("admin_dashboard", { categories }); // Pass categories to EJS
  } catch (err) {
    console.error("Error fetching categories:", err.message);
    res.status(500).send("Something went wrong");
  }
});



router.get("/", async function(req, res) {
  try {
    const category = req.query.category;

    let prods;

    if (category && category !== 'all') {
      prods = await Product.find({ category: category });
    } else {
      prods = await Product.find();
    }

    res.json(prods);
  } catch (err) {
    res.status(500).json({ error: "Something went wrong", details: err.message });
  }
});

// ✅ Handle product creation
router.post("/", upload.array("images"), async (req, res) => {
  try {
    const imageUrls = [];

    for (let file of req.files) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "ecommerce-products",
      });

      imageUrls.push(result.secure_url);

      // Delete file locally
      fs.unlinkSync(file.path);
    }

    const { name, price, category, stock, description } = req.body;

    const newProduct = new Product({
      name,
      price,
      category,
      stock,
      description,
      images: imageUrls,
    });

    await newProduct.save();

    res.status(201).send("Product created successfully!");

  } catch (err) {
    console.error("❌ Error while uploading product:", err);
    res.status(500).send("Something went wrong while uploading product.");
  }
});


router.get("/delete/:id", validateAdmin, async function(req, res) {
  const id = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send("Invalid Product ID");
  }

  if (req.user.admin) {
    await Product.findOneAndDelete({ _id: id });
    return res.redirect("back"); 
  }

  return res.status(403).send("You are not allowed to delete this product."); 
});





module.exports = router;
