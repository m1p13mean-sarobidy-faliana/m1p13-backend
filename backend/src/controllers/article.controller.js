const Article = require("../models/article.model");

exports.getAllArticles = async (req, res) => {
  try {
    const articles = await Article.find();
    res.json({ success: true, data: articles });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

exports.getAllArticlesById = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ success: false, message: "Article non trouvé" });
    }
    res.json({ success: true, data: article });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

exports.createArticle = async (req, res) => {
  try {
    const article = new Article(req.body);
    await article.save();
    res.status(201).json({ success: true, message: "Article créé", data: article });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateArticle = async (req, res) => {
  try {
    const article = await Article.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!article) {
      return res.status(404).json({ success: false, message: "Article non trouvé" });
    }
    res.json({ success: true, message: "Article mis à jour", data: article });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteArticle = async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) {
      return res.status(404).json({ success: false, message: "Article non trouvé" });
    }
    res.json({ success: true, message: "Article supprimé" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};
