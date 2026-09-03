const router = require("express").Router();

const { getPosts, getPost, createPost } = require("../controllers/posts");
const auth = require("../middlewares/auth");
const {
  validatePostId,
  validatePostQuery,
  validatePostCreation,
} = require("../middlewares/validation");

router.get("/", validatePostQuery, getPosts);
router.post("/", auth, validatePostCreation, createPost);
router.get("/:postId", validatePostId, getPost);

module.exports = router;
