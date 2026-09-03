const Follow = require("../models/follow");
const User = require("../models/user");
const BadRequestError = require("../errors/bad-request-error");
const ConflictError = require("../errors/conflict-error");
const NotFoundError = require("../errors/not-found-error");

const userFields = "name about avatar isPrivate lastActiveAt";

const getPagination = (query) => ({
  page: Number(query.page) || 1,
  limit: Number(query.limit) || 20,
});

const getPaginationMetadata = ({ page, limit, total }) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
  hasNextPage: page * limit < total,
  hasPreviousPage: page > 1,
});

const followUser = async (req, res) => {
  if (req.params.userId === req.user._id.toString()) {
    throw new BadRequestError("Users cannot follow themselves");
  }

  const targetUser = await User.findById(req.params.userId);

  if (!targetUser) {
    throw new NotFoundError("User not found");
  }

  const existingFollow = await Follow.findOne({
    follower: req.user._id,
    following: targetUser._id,
  });

  if (existingFollow) {
    throw new ConflictError(
      existingFollow.status === "pending"
        ? "A follow request is already pending"
        : "You already follow this user",
    );
  }

  const isAccepted = !targetUser.isPrivate;
  const follow = await Follow.create({
    follower: req.user._id,
    following: targetUser._id,
    status: isAccepted ? "accepted" : "pending",
    acceptedAt: isAccepted ? new Date() : null,
  });

  await follow.populate("following", userFields);

  res.status(201).send({
    follow,
  });
};

const unfollowUser = async (req, res) => {
  const follow = await Follow.findOneAndDelete({
    follower: req.user._id,
    following: req.params.userId,
  });

  if (!follow) {
    throw new NotFoundError("Follow relationship or request not found");
  }

  res.status(204).send();
};

const getFollowers = async (req, res) => {
  const { page, limit } = getPagination(req.query);
  const query = {
    following: req.user._id,
    status: "accepted",
  };

  const [relationships, total] = await Promise.all([
    Follow.find(query)
      .populate("follower", userFields)
      .sort({
        acceptedAt: -1,
        _id: -1,
      })
      .skip((page - 1) * limit)
      .limit(limit),
    Follow.countDocuments(query),
  ]);

  res.send({
    followers: relationships.map((relationship) => ({
      relationshipId: relationship._id,
      user: relationship.follower,
      followedAt: relationship.acceptedAt,
    })),
    pagination: getPaginationMetadata({
      page,
      limit,
      total,
    }),
  });
};

const getFollowing = async (req, res) => {
  const { page, limit } = getPagination(req.query);
  const query = {
    follower: req.user._id,
    status: "accepted",
  };

  const [relationships, total] = await Promise.all([
    Follow.find(query)
      .populate("following", userFields)
      .sort({
        acceptedAt: -1,
        _id: -1,
      })
      .skip((page - 1) * limit)
      .limit(limit),
    Follow.countDocuments(query),
  ]);

  res.send({
    following: relationships.map((relationship) => ({
      relationshipId: relationship._id,
      user: relationship.following,
      followedAt: relationship.acceptedAt,
    })),
    pagination: getPaginationMetadata({
      page,
      limit,
      total,
    }),
  });
};

const getFollowRequests = async (req, res) => {
  const { page, limit } = getPagination(req.query);
  const query = {
    following: req.user._id,
    status: "pending",
  };

  const [relationships, total] = await Promise.all([
    Follow.find(query)
      .populate("follower", userFields)
      .sort({
        createdAt: -1,
        _id: -1,
      })
      .skip((page - 1) * limit)
      .limit(limit),
    Follow.countDocuments(query),
  ]);

  res.send({
    requests: relationships.map((relationship) => ({
      requestId: relationship._id,
      user: relationship.follower,
      requestedAt: relationship.createdAt,
    })),
    pagination: getPaginationMetadata({
      page,
      limit,
      total,
    }),
  });
};

const acceptFollowRequest = async (req, res) => {
  const follow = await Follow.findOneAndUpdate(
    {
      _id: req.params.followId,
      following: req.user._id,
      status: "pending",
    },
    {
      $set: {
        status: "accepted",
        acceptedAt: new Date(),
      },
    },
    {
      returnDocument: "after",
      runValidators: true,
    },
  )
    .populate("follower", userFields)
    .populate("following", userFields);

  if (!follow) {
    throw new NotFoundError("Pending follow request not found");
  }

  res.send({
    follow,
  });
};

const rejectFollowRequest = async (req, res) => {
  const follow = await Follow.findOneAndDelete({
    _id: req.params.followId,
    following: req.user._id,
    status: "pending",
  });

  if (!follow) {
    throw new NotFoundError("Pending follow request not found");
  }

  res.status(204).send();
};

const removeFollower = async (req, res) => {
  const follow = await Follow.findOneAndDelete({
    follower: req.params.userId,
    following: req.user._id,
    status: "accepted",
  });

  if (!follow) {
    throw new NotFoundError("Follower not found");
  }

  res.status(204).send();
};

const getFollowSummary = async (req, res) => {
  const [followersCount, followingCount, pendingRequestsCount] =
    await Promise.all([
      Follow.countDocuments({
        following: req.user._id,
        status: "accepted",
      }),
      Follow.countDocuments({
        follower: req.user._id,
        status: "accepted",
      }),
      Follow.countDocuments({
        following: req.user._id,
        status: "pending",
      }),
    ]);

  res.send({
    followersCount,
    followingCount,
    pendingRequestsCount,
  });
};

module.exports = {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getFollowRequests,
  acceptFollowRequest,
  rejectFollowRequest,
  removeFollower,
  getFollowSummary,
};
