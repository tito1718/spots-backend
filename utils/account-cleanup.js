const Bookmark = require("../models/bookmark");
const Collection = require("../models/collection");
const Comment = require("../models/comment");
const Follow = require("../models/follow");
const Notification = require("../models/notification");
const Post = require("../models/post");
const Session = require("../models/session");
const User = require("../models/user");

const deleteUserAccountData = async (userId) => {
  const [posts, comments, follows] = await Promise.all([
    Post.find({
      owner: userId,
    }).select("_id"),
    Comment.find({
      owner: userId,
    }).select("_id"),
    Follow.find({
      $or: [
        {
          follower: userId,
        },
        {
          following: userId,
        },
      ],
    }).select("_id"),
  ]);

  const postIds = posts.map(({ _id }) => _id);
  const commentIds = comments.map(({ _id }) => _id);
  const followIds = follows.map(({ _id }) => _id);

  await Promise.all([
    Bookmark.deleteMany({
      $or: [
        {
          owner: userId,
        },
        {
          post: {
            $in: postIds,
          },
        },
      ],
    }),
    Collection.deleteMany({
      owner: userId,
    }),
    Collection.updateMany(
      {
        coverPost: {
          $in: postIds,
        },
      },
      {
        $set: {
          coverPost: null,
        },
      },
    ),
    Notification.deleteMany({
      $or: [
        {
          recipient: userId,
        },
        {
          actor: userId,
        },
        {
          post: {
            $in: postIds,
          },
        },
        {
          comment: {
            $in: commentIds,
          },
        },
        {
          follow: {
            $in: followIds,
          },
        },
      ],
    }),
    Comment.deleteMany({
      $or: [
        {
          owner: userId,
        },
        {
          post: {
            $in: postIds,
          },
        },
      ],
    }),
    Follow.deleteMany({
      $or: [
        {
          follower: userId,
        },
        {
          following: userId,
        },
      ],
    }),
    Post.updateMany(
      {
        likedBy: userId,
      },
      {
        $pull: {
          likedBy: userId,
        },
      },
    ),
    Session.deleteMany({
      user: userId,
    }),
  ]);

  await Post.deleteMany({
    _id: {
      $in: postIds,
    },
  });

  await User.deleteOne({
    _id: userId,
  });
};

module.exports = {
  deleteUserAccountData,
};
