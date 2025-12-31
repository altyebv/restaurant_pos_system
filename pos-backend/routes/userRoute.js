const express = require("express");
const { 
  register, 
  login, 
  getUserData, 
  logout,
  getAllUsers,
  updateUser,
  deleteUser
} = require("../controllers/userController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const router = express.Router();

// Authentication Routes
router.route("/register").post(register);
router.route("/login").post(login);
router.route("/logout").post(isVerifiedUser, logout);

// User management (protected routes)
router.route("/").get(isVerifiedUser, getUserData);
router.route("/all").get(isVerifiedUser, getAllUsers);
router.route("/:id").put(isVerifiedUser, updateUser);
router.route("/:id").delete(isVerifiedUser, deleteUser);

module.exports = router;