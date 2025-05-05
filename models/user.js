const mongoose = require("mongoose");
const Joi = require("joi");

// Address Schema (Embedded in User Schema)
const AddressSchema = new mongoose.Schema({
  street: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  zipCode: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true, default: "India" }
});

const UserSchema = new mongoose.Schema(
  {
    googleId: { type: String, unique: true, sparse: true }, // ✅ Add googleId
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
      lowercase: true, 
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
    },
    password: { 
      type: String, 
      minlength: [6, "Password must be at least 6 characters long"] 
    },
    phone: { 
      type: String, 
      // unique: true, 
      match: [/^\d{10}$/, "Phone number must be exactly 10 digits"]
    },
    addresses: { type: [AddressSchema], default: [] }, 
    resetToken: { type: String },
    resetTokenExpiry: { type: Date }
  },
  { timestamps: true }
);


// ✅ Joi Validation for User Input
const validateUser = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(50).trim().required(),
    email: Joi.string().email().trim().required(),
    password: Joi.string().min(6),
    phone: Joi.string().pattern(/^\d{10}$/),
    addresses: Joi.array().items(
      Joi.object({
        street: Joi.string().trim().required(),
        city: Joi.string().trim().required(),
        state: Joi.string().trim().required(),
        zipCode: Joi.string().trim().required(),
        country: Joi.string().trim().default("India"),
      })
    ),
  });

  return schema.validate(data);
};

module.exports = {
  User: mongoose.model("User", UserSchema),
  validateUser,
};
