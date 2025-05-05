const mongoose = require("mongoose");
const Joi = require("joi");

// Category Schema
const CategorySchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: [true, "Category name is required"], 
      unique: true, 
      trim: true, 
      minlength: [2, "Category name must be at least 2 characters long"],
      maxlength: [50, "Category name cannot exceed 50 characters"]
    },
    color: {
      type: String,
      default: "#f3f4f6", // light gray
      match: /^#([0-9a-fA-F]{3}){1,2}$/, // basic hex color validation
    },
  },
  { timestamps: true }
);

// ✅ Joi Validation for Category
const validateCategory = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(50).trim().required(),
    color: Joi.string().pattern(/^#([0-9a-fA-F]{3}){1,2}$/).optional()
  });

  return schema.validate(data);
};

module.exports = {
  Category: mongoose.model("Category", CategorySchema),
  validateCategory,
};
