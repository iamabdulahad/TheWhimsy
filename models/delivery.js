const mongoose = require("mongoose");
const Joi = require("joi");

// Delivery Schema
const DeliverySchema = new mongoose.Schema(
  {
    order: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Order", 
      required: [true, "Order ID is required"] 
    },

    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: [true, "User ID is required"] 
    },

    deliveryPerson: { 
      type: String, 
      default: "Not Assigned", 
      trim: true 
    },

    deliveryContact: { 
      type: String, 
      match: [/^\d{10}$/, "Phone number must be exactly 10 digits"], 
      required: function() { return this.deliveryPerson !== "Not Assigned"; } // Required if delivery person is assigned
    },

    expectedDeliveryDate: { 
      type: Date, 
      required: [true, "Expected delivery date is required"] 
    },

    actualDeliveryDate: { type: Date }, // Nullable, updates on delivery

    status: { 
      type: String, 
      enum: ["pending", "out for delivery", "delivered", "failed"], 
      default: "pending" 
    },

    trackingId: { 
      type: String, 
      unique: true, 
      required: [true, "Tracking ID is required"] 
    },
  },
  { timestamps: true } // Adds createdAt & updatedAt timestamps
);

// ✅ Joi Validation for Delivery
const validateDelivery = (data) => {
  const schema = Joi.object({
    order: Joi.string().hex().length(24).required(), // Must be a valid MongoDB ObjectId
    user: Joi.string().hex().length(24).required(), // Must be a valid MongoDB ObjectId
    deliveryPerson: Joi.string().trim().optional(),
    deliveryContact: Joi.string().pattern(/^\d{10}$/).optional(),
    expectedDeliveryDate: Joi.date().required(),
    actualDeliveryDate: Joi.date().optional(),
    status: Joi.string().valid("pending", "out for delivery", "delivered", "failed").default("pending"),
    trackingId: Joi.string().required(),
  });

  return schema.validate(data);
};

module.exports = {
  Delivery: mongoose.model("Delivery", DeliverySchema),
  validateDelivery,
};
