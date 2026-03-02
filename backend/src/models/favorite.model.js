const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true }
}, { timestamps: true });

favoriteSchema.index({ user: 1, shop: 1 }, { unique: true });

module.exports = mongoose.model("Favorite", favoriteSchema);
