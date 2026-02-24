const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true , unique: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  password: { type: String, required: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  phone: { type: String, required: false },
  address: { type: String, required: false },
  role: { type: String, required: true, enum: ["CUSTOMER", "SHOP_MANAGER", "ADMIN"], default: "CUSTOMER" },
  status: { type: String, required: true, enum: ["VALID", "SUSPENDED", "WAITING"], default: "WAITING" },
  verificationToken: { type: String, required: false },
  verificationTokenExpires: { type: Date, required: false },
  emailVerified: { type: Boolean, default: false },
  passwordResetToken: { type: String, required: false },
  passwordResetTokenExpires: { type: Date, required: false },
  mfaCode: { type: String, required: false },
  mfaCodeExpires: { type: Date, required: false },
  mfaEnabled: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);