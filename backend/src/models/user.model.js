const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true , unique: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, required: true, enum: ["customer", "shop_manager", "admin"], default: "customer" },
  phone: { type: String, required: false },
  status: { type: String, required: true, enum: ["active", "pending"], default: "active" },
  verificationToken: { type: String, required: false },
  verificationTokenExpires: { type: Date, required: false },
  emailVerified: { type: Boolean, default: false },
  passwordResetToken: { type: String, required: false },
  passwordResetTokenExpires: { type: Date, required: false }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);