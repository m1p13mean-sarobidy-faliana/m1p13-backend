const mongoose = require("mongoose");

const shopSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: false },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, required: true, enum: ["pending", "active", "inactive"], default: "pending" }
}, { timestamps: true });

module.exports = mongoose.model("Shop", shopSchema);