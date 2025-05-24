const mongoose = require("mongoose");
const Joi = require("joi");

// Product Schema
const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [2, "Product name must be at least 2 characters long"],
      maxlength: [100, "Product name cannot exceed 100 characters"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    stock: {
      type: Number,
      required: [true, "Stock is required"],
      min: [0, "Stock cannot be negative"],
    },

    // 🆕 Structured Description Fields
    weight: {
      type: String,
      trim: true,
      maxlength: [50, "Weight cannot exceed 50 characters"],
    },
    about: {
      type: String,
      trim: true,
      maxlength: [1000, "About section cannot exceed 1000 characters"],
    },
    ingredients: {
      type: [String],
      default: [],
      validate: {
        validator: function (arr) {
          return arr.every(item => typeof item === "string" && item.trim().length > 0);
        },
        message: "Ingredients must be an array of non-empty strings",
      },
    },

    images: {
      type: [String],
      default: [],
      validate: {
        validator: function (images) {
          return images.every(img => typeof img === "string" && img.trim() !== "");
        },
        message: "Images must be an array of non-empty strings",
      },
    },
  },
  { timestamps: true }
);

// ✅ Joi Validation for Product
const validateProduct = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).trim().required(),
    price: Joi.number().min(0).required(),
    category: Joi.string().hex().length(24).required(), // MongoDB ObjectId
    stock: Joi.number().min(0).required(),

    // 🆕 Structured fields
    weight: Joi.string().max(50).trim().allow(""),
    about: Joi.string().max(1000).trim().allow(""),
    ingredients: Joi.array().items(Joi.string().trim().min(1)).max(50),

    images: Joi.array().items(Joi.string().uri()).max(5),
  });

  return schema.validate(data);
};

module.exports = {
  Product: mongoose.model("Product", ProductSchema),
  validateProduct,
};
