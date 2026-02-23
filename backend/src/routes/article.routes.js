const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/auth.middleware");
const { authorize }  = require("../middlewares/role.middleware");

const {getAllArticles, getAllArticlesById, createArticle, updateArticle, deleteArticle} = require("../controllers/article.controller");

router.get("/", protect, getAllArticles);
router.get("/:id", protect, getAllArticlesById);
router.post("/create/", protect, authorize('shop_manager'), createArticle);
router.put("/update/:id", protect, authorize('shop_manager'), updateArticle);
router.delete("/delete/:id", protect, authorize('shop_manager'), deleteArticle);

module.exports = router;