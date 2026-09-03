const router = require("express").Router();

const {
  getCurrentUser,
  updateCurrentUser,
  searchUsers,
  getUserProfile,
} = require("../controllers/users");
const auth = require("../middlewares/auth");
const optionalAuth = require("../middlewares/optional-auth");
const { validateProfileUpdate } = require("../middlewares/validation");
const {
  validateUserSearch,
  validateUserId,
} = require("../middlewares/user-validation");

router.get("/", auth, validateUserSearch, searchUsers);

router.get("/me", auth, getCurrentUser);
router.patch("/me", auth, validateProfileUpdate, updateCurrentUser);

router.get("/:userId", optionalAuth, validateUserId, getUserProfile);

module.exports = router;
