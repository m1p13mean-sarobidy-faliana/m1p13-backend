const Article = require("../models/article.model");

// Get all articles
exports.getAllArticles = async (req, res) => {
  try {
    const articles = await Article.find();
    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get by ID
exports.getAllArticlesById = async (req, res) => {
  try {
    const articles = await Article.find({ _id: req.params.id });
    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Create
exports.createArticle = async (req, res) => {
  try {
    const article = new Article(req.body);
    await article.save();
    res.status(201).json(article);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update by ID
exports.updateArticle = async (req, res) => {
  try {
    const article = await Article.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(article);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete by ID
exports.deleteArticle = async (req, res) => {
  try {
    await Article.findByIdAndDelete(req.params.id);
    res.json({ message: "Article deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
