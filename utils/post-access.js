const Follow = require("../models/follow");

const getPostOwnerId = (post) => post?.owner?._id || post?.owner;

const getAcceptedFollowingIds = (userId) =>
  Follow.find({
    follower: userId,
    status: "accepted",
  }).distinct("following");

const canViewPost = async (post, user) => {
  if (!post) {
    return false;
  }

  if (post.visibility === "public") {
    return true;
  }

  if (!user) {
    return false;
  }

  const ownerId = getPostOwnerId(post);

  if (ownerId?.toString() === user._id.toString() || user.role === "admin") {
    return true;
  }

  if (post.visibility !== "followers") {
    return false;
  }

  const relationship = await Follow.exists({
    follower: user._id,
    following: ownerId,
    status: "accepted",
  });

  return Boolean(relationship);
};

const getVisiblePostQuery = async (user) => {
  if (!user) {
    return {
      visibility: "public",
    };
  }

  if (user.role === "admin") {
    return {};
  }

  const followingIds = await getAcceptedFollowingIds(user._id);

  return {
    $or: [
      {
        visibility: "public",
      },
      {
        owner: user._id,
      },
      {
        visibility: "followers",
        owner: {
          $in: followingIds,
        },
      },
    ],
  };
};

module.exports = {
  getPostOwnerId,
  getAcceptedFollowingIds,
  canViewPost,
  getVisiblePostQuery,
};
