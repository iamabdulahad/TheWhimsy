const express = require("express");
const router = express.Router();
const { Category } = require("../models/category");

router.post("/add", async (req, res) => {
  try {
    const { name, color } = req.body; // ✅ get color from form
    const existing = await Category.findOne({ name });

    if (existing) {
      return res.render("add-category", { error: "Category already exists" });
    }

    const category = new Category({ name, color }); // ✅ include color
    await category.save();

    res.redirect("/admin/dashboard"); 
  } catch (err) {
    console.error("Error adding category:", err);
    res.status(500).send("Server Error");
  }
});




module.exports = router;
