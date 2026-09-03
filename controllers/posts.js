const Bookmark = require("../models/bookmark");
const Collection = require("../models/collection");
const Comment = require("../models/comment");
const Post = require("../models/post");
const User = require("../models/user");
const ForbiddenError = require("../errors/forbidden-error");
const NotFoundError = require("../errors/not-found-error");
const {
  createPostLikeNotification,
  deletePostLikeNotification,
  deletePostNotifications,
} = require("../utils/notifications");
const {
  canViewPost,
  getVisiblePostQuery,
  getVisiblePostAggregationQuery,
} = require("../utils/post-access");

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

const getNearbyPosts = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 12;
  const radiusKm = Number(req.query.radiusKm) || 25;
  const visibilityQuery = await getVisiblePostAggregationQuery(req.user);

  const geoQuery = {
    ...visibilityQuery,
  };

  if (req.query.tag) {
    geoQuery.tags = req.query.tag.toLowerCase();
  }

  const [result] = await Post.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [
            Number(req.query.longitude),
            Number(req.query.latitude),
          ],
        },
        key: "location.point",
        distanceField: "distanceMeters",
        maxDistance: radiusKm * 1000,
        spherical: true,
        query: geoQuery,
      },
    },
    {
      $facet: {
        matches: [
          {
            $skip: (page - 1) * limit,
          },
          {
            $limit: limit,
          },
          {
            $project: {
              _id: 1,
              distanceMeters: 1,
            },
          },
        ],
        metadata: [
          {
            $count: "total",
          },
        ],
      },
    },
  ]);

  const matches = result?.matches || [];
  const ids = matches.map(({ _id }) => _id);
  const total = result?.metadata?.[0]?.total || 0;

  const posts = await populatePost(
    Post.find({
      _id: {
        $in: ids,
      },
    }),
  );

  const postsById = new Map(posts.map((post) => [post._id.toString(), post]));

  const distancesById = new Map(
    matches.map(({ _id, distanceMeters }) => [
      _id.toString(),
      Math.round(distanceMeters),
    ]),
  );

  res.send({
    posts: ids
      .map((id) => {
        const post = postsById.get(id.toString());

        if (!post) {
          return null;
        }

        return {
          ...serializePost(post, req.user?._id),
          distanceMeters: distancesById.get(id.toString()),
        };
      })
      .filter(Boolean),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
    searchArea: {
      center: {
        type: "Point",
        coordinates: [Number(req.query.longitude), Number(req.query.latitude)],
      },
      radiusKm,
    },
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

const getUserPosts = async (req, res) => {
  const userExists = await User.exists({
    _id: req.params.userId,
  });

  if (!userExists) {
    throw new NotFoundError("User not found");
  }

  const pagination = getPagination(req.query);
  const visibilityQuery = await getVisiblePostQuery(req.user);
  const query = addFilters(
    {
      $and: [
        {
          owner: req.params.userId,
        },
        visibilityQuery,
      ],
    },
    req.query,
  );

  const result = await findPaginatedPosts({
    query,
    ...pagination,
  });

  res.send({
    posts: result.posts.map((post) => serializePost(post, req.user?._id)),
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
  getNearbyPosts,
  getMyPosts,
  getUserPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
};
