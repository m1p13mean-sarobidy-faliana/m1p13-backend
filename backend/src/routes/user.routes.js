const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { protect } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");


router.get("/", protect, authorize("admin"), userController.getAllUsers);
router.get("/search", protect, authorize("admin"), userController.searchUsers);
router.get("/:id", protect, authorize("admin"), userController.getAllUsersById);
router.post("/create", protect, authorize("admin"), userController.createUser);
router.put("/update/:id", protect, authorize("admin"), userController.updateUser);
router.delete("/delete/:id", protect, authorize("admin"), userController.deleteUser);

module.exports = router;