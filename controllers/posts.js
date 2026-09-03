const Post = require("../models/post");
const ForbiddenError = require("../errors/forbidden-error");
const NotFoundError = require("../errors/not-found-error");

const serializePost = (post, currentUserId) => {
  const serialized = post.toJSON();

  serialized.isLiked = currentUserId
    ? serialized.likedBy.some(
        (userId) => userId.toString() === currentUserId.toString(),
      )
    : false;

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
    Post.find(query)
      .populate("owner", "name about avatar")
      .sort({ createdAt: sortDirection, _id: sortDirection })
      .skip((page - 1) * limit)
      .limit(limit),
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
  const query = addFilters({ visibility: "public" }, req.query);

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
  const query = addFilters({ owner: req.user._id }, req.query);

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
  const post = await Post.findById(req.params.postId).populate(
    "owner",
    "name about avatar",
  );

  const ownerId = post?.owner?._id?.toString();
  const currentUserId = req.user?._id?.toString();
  const canView =
    post &&
    (post.visibility === "public" ||
      ownerId === currentUserId ||
      req.user?.role === "admin");

  if (!canView) {
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

  await post.populate("owner", "name about avatar");

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
  await post.populate("owner", "name about avatar");

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
  await post.deleteOne();

  res.status(204).send();
};

const likePost = async (req, res) => {
  const post = await Post.findOneAndUpdate(
    {
      _id: req.params.postId,
      visibility: "public",
    },
    {
      $addToSet: {
        likedBy: req.user._id,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  ).populate("owner", "name about avatar");

  if (!post) {
    throw new NotFoundError("Post not found");
  }

  res.send({
    post: serializePost(post, req.user._id),
  });
};

const unlikePost = async (req, res) => {
  const post = await Post.findOneAndUpdate(
    {
      _id: req.params.postId,
      visibility: "public",
    },
    {
      $pull: {
        likedBy: req.user._id,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  ).populate("owner", "name about avatar");

  if (!post) {
    throw new NotFoundError("Post not found");
  }

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
