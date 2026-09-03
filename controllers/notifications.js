const Notification = require("../models/notification");
const NotFoundError = require("../errors/not-found-error");

const populateNotification = (query) =>
  query
    .populate("actor", "name about avatar")
    .populate("post", "caption image visibility owner")
    .populate("comment", "body editedAt")
    .populate("follow", "status acceptedAt");

const getNotifications = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const query = {
    recipient: req.user._id,
  };

  if (req.query.unreadOnly) {
    query.readAt = null;
  }

  const [notifications, total] = await Promise.all([
    populateNotification(
      Notification.find(query)
        .sort({
          createdAt: -1,
          _id: -1,
        })
        .skip((page - 1) * limit)
        .limit(limit),
    ),
    Notification.countDocuments(query),
  ]);

  res.send({
    notifications,
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

const getUnreadCount = async (req, res) => {
  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    readAt: null,
  });

  res.send({
    unreadCount,
  });
};

const markNotificationRead = async (req, res) => {
  const notification = await populateNotification(
    Notification.findOneAndUpdate(
      {
        _id: req.params.notificationId,
        recipient: req.user._id,
      },
      {
        $set: {
          readAt: new Date(),
        },
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    ),
  );

  if (!notification) {
    throw new NotFoundError("Notification not found");
  }

  res.send({
    notification,
  });
};

const markAllNotificationsRead = async (req, res) => {
  const result = await Notification.updateMany(
    {
      recipient: req.user._id,
      readAt: null,
    },
    {
      $set: {
        readAt: new Date(),
      },
    },
  );

  res.send({
    updatedCount: result.modifiedCount,
  });
};

const deleteNotification = async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.notificationId,
    recipient: req.user._id,
  });

  if (!notification) {
    throw new NotFoundError("Notification not found");
  }

  res.status(204).send();
};

const clearNotifications = async (req, res) => {
  await Notification.deleteMany({
    recipient: req.user._id,
  });

  res.status(204).send();
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearNotifications,
};
