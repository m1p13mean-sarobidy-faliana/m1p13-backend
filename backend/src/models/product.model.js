const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: false },
  price: { type: Number, required: true, min: 0 },
  image: { type: String, required: false },
  shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

productSchema.index({ shop: 1 });
productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model("Product", productSchema);
