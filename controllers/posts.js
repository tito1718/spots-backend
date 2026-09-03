const Bookmark = require("../models/bookmark");
const Collection = require("../models/collection");
const Comment = require("../models/comment");
const Post = require("../models/post");
const ForbiddenError = require("../errors/forbidden-error");
const NotFoundError = require("../errors/not-found-error");
const {
  createPostLikeNotification,
  deletePostLikeNotification,
  deletePostNotifications,
} = require("../utils/notifications");
const { canViewPost, getVisiblePostQuery } = require("../utils/post-access");

const populatePost = (query) =>
  query.populate("owner", "name about avatar").populate("commentCount");

const populatePostDocument = (post) =>
  post.populate([
    {
      path: "owner",
      select: "name about avatar",
    },
    {
      path: "commentCount",
    },
  ]);

const serializePost = (post, currentUserId) => {
  const serialized = post.toJSON();

  serialized.isLiked = currentUserId
    ? serialized.likedBy.some(
        (userId) => userId.toString() === currentUserId.toString(),
      )
    : false;

  serialized.commentCount ??= 0;
  delete serialized.likedBy;

  return serialized;
};

const getPagination = (query) => ({
  page: Number(query.page) || 1,
  limit: Number(query.limit) || 12,
  sortDirection: query.sort === "oldest" ? 1 : -1,
});

const findPaginatedPosts = async ({ query, page, limit, sortDirection }) => {
  const [posts, total] = await Promise.all([
    populatePost(
      Post.find(query)
        .sort({
          createdAt: sortDirection,
          _id: sortDirection,
        })
        .skip((page - 1) * limit)
        .limit(limit),
    ),
    Post.countDocuments(query),
  ]);

  return {
    posts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  };
};

const addFilters = (query, requestQuery) => {
  if (requestQuery.search) {
    query.$text = {
      $search: requestQuery.search,
    };
  }

  if (requestQuery.tag) {
    query.tags = requestQuery.tag.toLowerCase();
  }

  return query;
};

const getPosts = async (req, res) => {
  const pagination = getPagination(req.query);
  const visibilityQuery = await getVisiblePostQuery(req.user);
  const query = addFilters(visibilityQuery, req.query);

  const result = await findPaginatedPosts({
    query,
    ...pagination,
  });

  res.send({
    posts: result.posts.map((post) => serializePost(post, req.user?._id)),
    pagination: result.pagination,
  });
};

const getMyPosts = async (req, res) => {
  const pagination = getPagination(req.query);
  const query = addFilters(
    {
      owner: req.user._id,
    },
    req.query,
  );

  const result = await findPaginatedPosts({
    query,
    ...pagination,
  });

  res.send({
    posts: result.posts.map((post) => serializePost(post, req.user._id)),
    pagination: result.pagination,
  });
};

const getPost = async (req, res) => {
  const post = await populatePost(Post.findById(req.params.postId));

  if (!post || !(await canViewPost(post, req.user))) {
    throw new NotFoundError("Post not found");
  }

  res.send({
    post: serializePost(post, req.user?._id),
  });
};

const createPost = async (req, res) => {
  const post = await Post.create({
    ...req.body,
    owner: req.user._id,
  });

  await populatePostDocument(post);

  res.status(201).send({
    post: serializePost(post, req.user._id),
  });
};

const assertCanManagePost = (post, user) => {
  if (post.owner.toString() !== user._id.toString() && user.role !== "admin") {
    throw new ForbiddenError("Only the post owner can modify this post");
  }
};

const updatePost = async (req, res) => {
  const post = await Post.findById(req.params.postId);

  if (!post) {
    throw new NotFoundError("Post not found");
  }

  assertCanManagePost(post, req.user);

  const { location, ...updates } = req.body;
  Object.assign(post, updates);

  if (location === null) {
    post.location = undefined;
  } else if (location !== undefined) {
    post.location = location;
  }

  post.editedAt = new Date();
  await post.save();
  await populatePostDocument(post);

  res.send({
    post: serializePost(post, req.user._id),
  });
};

const deletePost = async (req, res) => {
  const post = await Post.findById(req.params.postId);

  if (!post) {
    throw new NotFoundError("Post not found");
  }

  assertCanManagePost(post, req.user);

  await Promise.all([
    Bookmark.deleteMany({
      post: post._id,
    }),
    Comment.deleteMany({
      post: post._id,
    }),
    deletePostNotifications(post._id),
    Collection.updateMany(
      {
        coverPost: post._id,
      },
      {
        $set: {
          coverPost: null,
        },
      },
    ),
  ]);

  await post.deleteOne();
  res.status(204).send();
};

const updatePostLike = async ({ postId, user, operation }) => {
  const existingPost = await Post.findById(postId);

  if (!existingPost || !(await canViewPost(existingPost, user))) {
    throw new NotFoundError("Post not found");
  }

  const update =
    operation === "like"
      ? {
          $addToSet: {
            likedBy: user._id,
          },
        }
      : {
          $pull: {
            likedBy: user._id,
          },
        };

  return populatePost(
    Post.findByIdAndUpdate(postId, update, {
      returnDocument: "after",
      runValidators: true,
    }),
  );
};

const likePost = async (req, res) => {
  const post = await updatePostLike({
    postId: req.params.postId,
    user: req.user,
    operation: "like",
  });

  await createPostLikeNotification({
    post,
    actor: req.user._id,
  });

  res.send({
    post: serializePost(post, req.user._id),
  });
};

const unlikePost = async (req, res) => {
  const post = await updatePostLike({
    postId: req.params.postId,
    user: req.user,
    operation: "unlike",
  });

  await deletePostLikeNotification({
    postId: post._id,
    actor: req.user._id,
  });

  res.send({
    post: serializePost(post, req.user._id),
  });
};

module.exports = {
  getPosts,
  getMyPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
};
