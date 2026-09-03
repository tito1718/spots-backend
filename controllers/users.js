const User = require("../models/user");
const Follow = require("../models/follow");
const Post = require("../models/post");
const NotFoundError = require("../errors/not-found-error");
const { getVisiblePostQuery } = require("../utils/post-access");

const publicUserFields =
  "name about avatar isPrivate lastActiveAt createdAt updatedAt";

const getPaginationMetadata = ({ page, limit, total }) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
  hasNextPage: page * limit < total,
  hasPreviousPage: page > 1,
});

const escapeRegularExpression = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getRelationshipStatus = async (profileId, viewer) => {
  if (!viewer) {
    return "none";
  }

  if (profileId.toString() === viewer._id.toString()) {
    return "self";
  }

  const relationship = await Follow.findOne({
    follower: viewer._id,
    following: profileId,
  }).select("status");

  if (!relationship) {
    return "none";
  }

  return relationship.status === "accepted" ? "following" : "pending";
};

const getProfileStatistics = async (profileId, viewer) => {
  const visiblePostQuery = await getVisiblePostQuery(viewer);

  const [followersCount, followingCount, postsCount, relationshipStatus] =
    await Promise.all([
      Follow.countDocuments({
        following: profileId,
        status: "accepted",
      }),
      Follow.countDocuments({
        follower: profileId,
        status: "accepted",
      }),
      Post.countDocuments({
        $and: [
          {
            owner: profileId,
          },
          visiblePostQuery,
        ],
      }),
      getRelationshipStatus(profileId, viewer),
    ]);

  return {
    followersCount,
    followingCount,
    postsCount,
    relationshipStatus,
  };
};

const getCurrentUser = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  res.send({ user });
};

const updateCurrentUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, req.body, {
    returnDocument: "after",
    runValidators: true,
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  res.send({ user });
};

const searchUsers = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const searchExpression = new RegExp(
    escapeRegularExpression(req.query.search),
    "i",
  );

  const query = {
    $or: [
      {
        name: searchExpression,
      },
      {
        about: searchExpression,
      },
    ],
  };

  const [users, total] = await Promise.all([
    User.find(query)
      .select(publicUserFields)
      .sort({
        name: 1,
        _id: 1,
      })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(query),
  ]);

  const relationshipMap = new Map();

  if (users.length) {
    const relationships = await Follow.find({
      follower: req.user._id,
      following: {
        $in: users.map((user) => user._id),
      },
    }).select("following status");

    relationships.forEach((relationship) => {
      relationshipMap.set(
        relationship.following.toString(),
        relationship.status === "accepted" ? "following" : "pending",
      );
    });
  }

  res.send({
    users: users.map((user) => ({
      ...user.toObject(),
      relationshipStatus:
        user._id.toString() === req.user._id.toString()
          ? "self"
          : relationshipMap.get(user._id.toString()) || "none",
    })),
    pagination: getPaginationMetadata({
      page,
      limit,
      total,
    }),
  });
};

const getUserProfile = async (req, res) => {
  const user = await User.findById(req.params.userId).select(publicUserFields);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  const statistics = await getProfileStatistics(user._id, req.user);

  res.send({
    user: {
      ...user.toObject(),
      ...statistics,
    },
  });
};

module.exports = {
  getCurrentUser,
  updateCurrentUser,
  searchUsers,
  getUserProfile,
};
