const Comment = require("../models/comment");
const Post = require("../models/post");
const ForbiddenError = require("../errors/forbidden-error");
const NotFoundError = require("../errors/not-found-error");
const { canViewPost } = require("../utils/post-access");
const {
  createPostCommentNotification,
  deleteCommentNotification,
} = require("../utils/notifications");

const findAccessiblePost = async (postId, user) => {
  const post = await Post.findById(postId);

  if (!post || !(await canViewPost(post, user))) {
    throw new NotFoundError("Post not found");
  }

  return post;
};

const populateComment = (query) => query.populate("owner", "name about avatar");

const getComments = async (req, res) => {
  await findAccessiblePost(req.params.postId, req.user);

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const sortDirection = req.query.sort === "oldest" ? 1 : -1;
  const query = {
    post: req.params.postId,
  };

  const [comments, total] = await Promise.all([
    populateComment(
      Comment.find(query)
        .sort({
          createdAt: sortDirection,
          _id: sortDirection,
        })
        .skip((page - 1) * limit)
        .limit(limit),
    ),
    Comment.countDocuments(query),
  ]);

  res.send({
    comments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  });
};

const createComment = async (req, res) => {
  const post = await findAccessiblePost(req.params.postId, req.user);

  const comment = await Comment.create({
    owner: req.user._id,
    post: post._id,
    body: req.body.body,
  });

  await createPostCommentNotification({
    post,
    comment,
    actor: req.user._id,
  });

  await comment.populate("owner", "name about avatar");

  res.status(201).send({
    comment,
  });
};

const updateComment = async (req, res) => {
  const comment = await Comment.findById(req.params.commentId);

  if (!comment) {
    throw new NotFoundError("Comment not found");
  }

  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ForbiddenError("Only the comment author can edit this comment");
  }

  comment.body = req.body.body;
  comment.editedAt = new Date();
  await comment.save();
  await comment.populate("owner", "name about avatar");

  res.send({
    comment,
  });
};

const deleteComment = async (req, res) => {
  const comment = await Comment.findById(req.params.commentId);

  if (!comment) {
    throw new NotFoundError("Comment not found");
  }

  const post = await Post.findById(comment.post).select("owner");
  const isCommentAuthor = comment.owner.toString() === req.user._id.toString();
  const isPostOwner = post?.owner?.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isCommentAuthor && !isPostOwner && !isAdmin) {
    throw new ForbiddenError(
      "Only the comment author or post owner can delete this comment",
    );
  }

  await Promise.all([
    comment.deleteOne(),
    deleteCommentNotification(comment._id),
  ]);

  res.status(204).send();
};

module.exports = {
  getComments,
  createComment,
  updateComment,
  deleteComment,
};
