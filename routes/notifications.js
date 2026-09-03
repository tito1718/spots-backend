const router = require("express").Router();

const auth = require("../middlewares/auth");
const {
  validateNotificationQuery,
  validateNotificationId,
} = require("../middlewares/notification-validation");
const {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearNotifications,
} = require("../controllers/notifications");

router.use(auth);

router.get("/", validateNotificationQuery, getNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/read-all", markAllNotificationsRead);
router.delete("/", clearNotifications);

router.patch(
  "/:notificationId/read",
  validateNotificationId,
  markNotificationRead,
);

router.delete("/:notificationId", validateNotificationId, deleteNotification);

module.exports = router;
