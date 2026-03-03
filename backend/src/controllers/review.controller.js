const Review = require('../models/review.model');
const Shop = require('../models/shop.model');

exports.createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const shopId = req.params.shopId;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Note entre 1 et 5 requise' });
    }

    const shop = await Shop.findById(shopId);
    if (!shop || shop.status !== 'ACTIVE') {
      return res.status(404).json({ success: false, message: 'Boutique non trouvée' });
    }

    // Upsert: create or update review
    const review = await Review.findOneAndUpdate(
      { user: req.user.id, shop: shopId },
      { rating, comment },
      { upsert: true, new: true, runValidators: true }
    );

    // Recalculate shop average rating
    const avgResult = await Review.aggregate([
      { $match: { shop: shop._id } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);

    if (avgResult.length > 0) {
      shop.note = Math.round(avgResult[0].avgRating * 10) / 10;
      await shop.save();
    }

    res.status(201).json({ success: true, message: 'Avis enregistré', data: review });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.getShopReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ shop: req.params.id })
      .populate('user', 'first_name last_name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: reviews });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};
