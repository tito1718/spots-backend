const Post = require("../models/post");
const NotFoundError = require("../errors/not-found-error");

const serializePost = (post) => {
  const serialized = post.toJSON();

  delete serialized.likedBy;

  return serialized;
};

const getPosts = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 12;
  const sortDirection = req.query.sort === "oldest" ? 1 : -1;

  const query = {
    visibility: "public",
  };

  if (req.query.search) {
    query.$text = {
      $search: req.query.search,
    };
  }

  if (req.query.tag) {
    query.tags = req.query.tag.toLowerCase();
  }

  const [posts, total] = await Promise.all([
    Post.find(query)
      .populate("owner", "name about avatar")
      .sort({ createdAt: sortDirection, _id: sortDirection })
      .skip((page - 1) * limit)
      .limit(limit),
    Post.countDocuments(query),
  ]);

  res.send({
    posts: posts.map(serializePost),
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

const getPost = async (req, res) => {
  const post = await Post.findOne({
    _id: req.params.postId,
    visibility: "public",
  }).populate("owner", "name about avatar");

  if (!post) {
    throw new NotFoundError("Post not found");
  }

  res.send({
    post: serializePost(post),
  });
};

const createPost = async (req, res) => {
  const post = await Post.create({
    ...req.body,
    owner: req.user._id,
  });

  await post.populate("owner", "name about avatar");

  res.status(201).send({
    post: serializePost(post),
  });
};

module.exports = {
  getPosts,
  getPost,
  createPost,
};
