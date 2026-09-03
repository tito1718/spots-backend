const router = require("express").Router();

const auth = require("../middlewares/auth");
const {
  validateCommentId,
  validateCommentUpdate,
} = require("../middlewares/comment-validation");
const { updateComment, deleteComment } = require("../controllers/comments");

router.use(auth);

router.patch(
  "/:commentId",
  validateCommentId,
  validateCommentUpdate,
  updateComment,
);

router.delete("/:commentId", validateCommentId, deleteComment);

module.exports = router;
