const mongoose = require("mongoose");
const Joi = require("joi");

// Payment Schema
const PaymentSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: [true, "User ID is required"] 
    },

    order: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Order", 
      required: [true, "Order ID is required"] 
    },

    razorpayOrderId: { 
      type: String, 
      required: [true, "Razorpay Order ID is required"], 
      unique: true 
    },

    razorpayPaymentId: { 
      type: String, 
      unique: true 
    }, 

    razorpaySignature: { 
      type: String 
    }, 

    amount: { 
      type: Number, 
      required: [true, "Payment amount is required"],
      min: [1, "Amount must be at least 1"] // Amount should be greater than 0
    },

    currency: { 
      type: String, 
      default: "INR" 
    }, 

    status: { 
      type: String, 
      enum: ["created", "authorized", "captured", "failed", "refunded"], 
      default: "created" 
    },

    paymentMethod: { 
      type: String, 
      enum: ["card", "upi", "netbanking", "wallet"], 
      required: [true, "Payment method is required"] 
    },
  },
  { timestamps: true } // Automatically adds createdAt & updatedAt fields
);

// ✅ Joi Validation for Payment
const validatePayment = (data) => {
  const schema = Joi.object({
    user: Joi.string().hex().length(24).required(), // Valid MongoDB ObjectId
    order: Joi.string().hex().length(24).required(), // Valid MongoDB ObjectId
    razorpayOrderId: Joi.string().required(),
    razorpayPaymentId: Joi.string().optional(),
    razorpaySignature: Joi.string().optional(),
    amount: Joi.number().min(1).required(),
    currency: Joi.string().default("INR"),
    status: Joi.string().valid("created", "authorized", "captured", "failed", "refunded").default("created"),
    paymentMethod: Joi.string().valid("card", "upi", "netbanking", "wallet").required(),
  });

  return schema.validate(data);
};

module.exports = {
  Payment: mongoose.model("Payment", PaymentSchema),
  validatePayment,
};
