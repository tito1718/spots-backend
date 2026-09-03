const router = require("express").Router();

const {
  getCurrentUser,
  updateCurrentUser,
  searchUsers,
  getUserProfile,
} = require("../controllers/users");
const { getUserPosts } = require("../controllers/posts");
const auth = require("../middlewares/auth");
const optionalAuth = require("../middlewares/optional-auth");
const {
  validateProfileUpdate,
  validatePostQuery,
} = require("../middlewares/validation");
const {
  validateUserSearch,
  validateUserId,
} = require("../middlewares/user-validation");

router.get("/", auth, validateUserSearch, searchUsers);

router.get("/me", auth, getCurrentUser);
router.patch("/me", auth, validateProfileUpdate, updateCurrentUser);

router.get(
  "/:userId/posts",
  optionalAuth,
  validateUserId,
  validatePostQuery,
  getUserPosts,
);

router.get("/:userId", optionalAuth, validateUserId, getUserProfile);

module.exports = router;
