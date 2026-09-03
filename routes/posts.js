const router = require("express").Router();

const {
  getPosts,
  getNearbyPosts,
  getMyPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
} = require("../controllers/posts");
const { getComments, createComment } = require("../controllers/comments");
const auth = require("../middlewares/auth");
const optionalAuth = require("../middlewares/optional-auth");
const { validateNearbyPostQuery } = require("../middlewares/nearby-validation");
const {
  validatePostId,
  validatePostQuery,
  validatePostCreation,
  validatePostUpdate,
} = require("../middlewares/validation");
const {
  validateCommentPostId,
  validateCommentQuery,
  validateCommentCreation,
} = require("../middlewares/comment-validation");

router.get("/", optionalAuth, validatePostQuery, getPosts);

router.get("/nearby", optionalAuth, validateNearbyPostQuery, getNearbyPosts);

router.get("/mine", auth, validatePostQuery, getMyPosts);
router.post("/", auth, validatePostCreation, createPost);

router.get(
  "/:postId/comments",
  optionalAuth,
  validateCommentPostId,
  validateCommentQuery,
  getComments,
);

router.post(
  "/:postId/comments",
  auth,
  validateCommentPostId,
  validateCommentCreation,
  createComment,
);

router.get("/:postId", optionalAuth, validatePostId, getPost);
router.patch("/:postId", auth, validatePostId, validatePostUpdate, updatePost);
router.delete("/:postId", auth, validatePostId, deletePost);
router.put("/:postId/likes", auth, validatePostId, likePost);
router.delete("/:postId/likes", auth, validatePostId, unlikePost);

module.exports = router;
