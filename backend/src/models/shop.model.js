const mongoose = require("mongoose");

const shopSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: false },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: false },
  note: { type: Number, required: false, min: 0, max: 5 },
  hours: { type: String, required: false },
  image: { type: String, required: false },
  status: { type: String, required: true, enum: ["PENDING", "SUSPENDED", "ACTIVE"], default: "PENDING" }
}, { timestamps: true });

module.exports = mongoose.model("Shop", shopSchema);