const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  items: [
    {
      article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
      quantity: { type: Number, required: true, min: 1 }
    }
  ],
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ['PENDING', 'CONFIRMED', 'CANCELLED'], default: 'PENDING' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);