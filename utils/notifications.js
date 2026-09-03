const Notification = require("../models/notification");

const idsMatch = (firstId, secondId) =>
  firstId?.toString() === secondId?.toString();

const createNotification = async ({
  recipient,
  actor,
  type,
  post = null,
  comment = null,
  follow = null,
}) => {
  if (!recipient || !actor || idsMatch(recipient, actor)) {
    return null;
  }

  const notification = {
    recipient,
    actor,
    type,
    post,
    comment,
    follow,
  };

  return Notification.findOneAndUpdate(
    notification,
    {
      $setOnInsert: notification,
    },
    {
      upsert: true,
      returnDocument: "after",
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );
};

const createFollowRequestNotification = (follow) =>
  createNotification({
    recipient: follow.following,
    actor: follow.follower,
    type: "follow_request",
    follow: follow._id,
  });

const createFollowAcceptedNotification = (follow) =>
  createNotification({
    recipient: follow.follower,
    actor: follow.following,
    type: "follow_accepted",
    follow: follow._id,
  });

const createPostLikeNotification = ({ post, actor }) =>
  createNotification({
    recipient: post.owner?._id || post.owner,
    actor,
    type: "post_like",
    post: post._id,
  });

const createPostCommentNotification = ({ post, comment, actor }) =>
  createNotification({
    recipient: post.owner?._id || post.owner,
    actor,
    type: "post_comment",
    post: post._id,
    comment: comment._id,
  });

const deleteFollowNotifications = (followId, type) => {
  const query = {
    follow: followId,
  };

  if (type) {
    query.type = type;
  }

  return Notification.deleteMany(query);
};

const deletePostLikeNotification = ({ postId, actor }) =>
  Notification.deleteMany({
    post: postId,
    actor,
    type: "post_like",
  });

const deleteCommentNotification = (commentId) =>
  Notification.deleteMany({
    comment: commentId,
    type: "post_comment",
  });

const deletePostNotifications = (postId) =>
  Notification.deleteMany({
    post: postId,
  });

module.exports = {
  createFollowRequestNotification,
  createFollowAcceptedNotification,
  createPostLikeNotification,
  createPostCommentNotification,
  deleteFollowNotifications,
  deletePostLikeNotification,
  deleteCommentNotification,
  deletePostNotifications,
};
