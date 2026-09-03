const router = require("express").Router();

const {
  getPosts,
  getMyPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
} = require("../controllers/posts");
const auth = require("../middlewares/auth");
const optionalAuth = require("../middlewares/optional-auth");
const {
  validatePostId,
  validatePostQuery,
  validatePostCreation,
  validatePostUpdate,
} = require("../middlewares/validation");

router.get("/", optionalAuth, validatePostQuery, getPosts);
router.get("/mine", auth, validatePostQuery, getMyPosts);
router.post("/", auth, validatePostCreation, createPost);

router.get("/:postId", optionalAuth, validatePostId, getPost);
router.patch("/:postId", auth, validatePostId, validatePostUpdate, updatePost);
router.delete("/:postId", auth, validatePostId, deletePost);
router.put("/:postId/likes", auth, validatePostId, likePost);
router.delete("/:postId/likes", auth, validatePostId, unlikePost);

module.exports = router;
