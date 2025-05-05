const mongoose = require("mongoose");
const Joi = require("joi");

// Cart Schema
const CartSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: [true, "User ID is required"] 
    },

    products: [
      {
        product: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: "Product", 
          required: [true, "Product ID is required"] 
        },
        quantity: { 
          type: Number, 
          required: [true, "Quantity is required"], 
          min: [1, "Quantity must be at least 1"], 
          default: 1 
        }
      }
    ],

    totalPrice: { 
      type: Number, 
      default: 0, 
      min: [0, "Total price cannot be negative"]
    }, 
  },
  { timestamps: true } // Automatically adds createdAt & updatedAt timestamps
);

// ✅ Joi Validation for Cart
const validateCart = (data) => {
  const schema = Joi.object({
    user: Joi.string().hex().length(24).required(), // Valid MongoDB ObjectId
    products: Joi.array().items(
      Joi.object({
        product: Joi.string().hex().length(24).required(), // Valid MongoDB ObjectId
        quantity: Joi.number().min(1).required()
      })
    ).min(1).required(),

    totalPrice: Joi.number().min(0).default(0),
  });

  return schema.validate(data);
};

module.exports = {
  Cart: mongoose.model("Cart", CartSchema),
  validateCart,
};

