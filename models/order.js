const mongoose = require("mongoose");
const Joi = require("joi");

// Order Schema
const OrderSchema = new mongoose.Schema(
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
        },
        price: { 
          type: Number, 
          required: [true, "Price is required"],
          min: [0, "Price cannot be negative"] 
        }
      }
    ],

    totalAmount: { 
      type: Number, 
      required: [true, "Total amount is required"], 
      min: [0, "Total amount cannot be negative"] 
    },

    status: { 
      type: String, 
      enum: ["pending", "shipped", "delivered", "cancelled"], 
      default: "pending" 
    },

    address: { 
      type: String, 
      required: [true, "Shipping address is required"] 
    },

    paymentMethod: { 
      type: String, 
      enum: ["cod", "card", "upi"], 
      default: "cod" 
    },

    paymentStatus: { 
      type: String, 
      enum: ["pending", "paid", "failed"], 
      default: "pending" 
    },

  },
  { timestamps: true } // Automatically adds createdAt & updatedAt fields
);

// ✅ Joi Validation for Order
const validateOrder = (data) => {
  const schema = Joi.object({
    user: Joi.string().hex().length(24).required(), // Valid MongoDB ObjectId
    products: Joi.array().items(
      Joi.object({
        product: Joi.string().hex().length(24).required(), // Valid MongoDB ObjectId
        quantity: Joi.number().min(1).required(),
        price: Joi.number().min(0).required()
      })
    ).min(1).required(),

    totalAmount: Joi.number().min(0).required(),
    status: Joi.string().valid("pending", "shipped", "delivered", "cancelled").default("pending"),
    address: Joi.string().required(),
    paymentMethod: Joi.string().valid("cod", "card", "upi").default("cod"),
    paymentStatus: Joi.string().valid("pending", "paid", "failed").default("pending"),
  });

  return schema.validate(data);
};

module.exports = {
  Order: mongoose.model("Order", OrderSchema),
  validateOrder,
};
