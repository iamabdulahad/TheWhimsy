const mongoose = require("mongoose");
const Joi = require("joi");

// Admin Schema
const AdminSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: [true, "Name is required"], 
      trim: true, 
      minlength: [3, "Name must be at least 3 characters long"], 
      maxlength: [50, "Name cannot exceed 50 characters"] 
    },

    email: { 
      type: String, 
      required: [true, "Email is required"], 
      unique: true, 
      trim: true, 
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"] 
    },

    password: { 
      type: String, 
      required: [true, "Password is required"], 
      minlength: [6, "Password must be at least 6 characters long"] 
    },

    role: { 
      type: String, 
      enum: ["superadmin", "manager", "staff"], 
      default: "manager" 
    }, // Role-based access control

    phone: { 
      type: String, 
      match: [/^\d{10}$/, "Phone number must be exactly 10 digits"] 
    }, // Optional phone number validation

  },
  { timestamps: true } // Adds createdAt & updatedAt fields
);

// ✅ Joi Validation for Admin
const validateAdmin = (data) => {
  const schema = Joi.object({
    name: Joi.string().trim().min(3).max(50).required(),
    email: Joi.string().trim().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid("superadmin", "manager", "staff").default("manager"),
    phone: Joi.string().pattern(/^\d{10}$/).optional(),
  });

  return schema.validate(data);
};

module.exports = {
  Admin: mongoose.model("Admin", AdminSchema),
  validateAdmin,
};
