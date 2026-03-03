const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/auth.middleware");
const { authorize }  = require("../middlewares/role.middleware");

const {getAllArticles, getAllArticlesById, createArticle, updateArticle, deleteArticle} = require("../controllers/article.controller");

router.get("/", protect, getAllArticles);
router.get("/:id", protect, getAllArticlesById);
router.post("/create/", protect, authorize('SHOP_MANAGER'), createArticle);
router.put("/update/:id", protect, authorize('SHOP_MANAGER'), updateArticle);
router.delete("/delete/:id", protect, authorize('SHOP_MANAGER', 'ADMIN'), deleteArticle);

module.exports = router;