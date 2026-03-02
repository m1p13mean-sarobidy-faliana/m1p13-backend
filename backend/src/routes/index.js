const express = require("express");
const router = express.Router();

router.use("/articles", require("./article.routes"));
router.use("/users", require("./user.routes"));

// Routes d'authentification
router.use("/auth", require("./auth.routes"));
router.use("/myshop", require("./shop.routes"));
router.use("/admin", require("./admin.routes"));

// Routes publiques et acheteur
router.use("/public", require("./public.routes"));
router.use("/customer", require("./customer.routes"));

module.exports = router;
