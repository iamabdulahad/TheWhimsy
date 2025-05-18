const mongoose = require("mongoose");
const Joi = require("joi");

// Cart Schema
const CartSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true // ✅ User is required now
    },

    products: [
      {
        product: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: "Product", 
          required: true 
        },
        quantity: { 
          type: Number, 
          required: true, 
          min: 1, 
          default: 1 
        }
      }
    ],

    totalPrice: { 
      type: Number, 
      default: 0, 
      min: 0
    }, 
  },
  { timestamps: true }
);

// ✅ Joi Validation for Cart
const validateCart = (data) => {
  const schema = Joi.object({
    user: Joi.string().hex().length(24).required(), // ✅ Now required
    products: Joi.array().items(
      Joi.object({
        product: Joi.string().hex().length(24).required(),
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
