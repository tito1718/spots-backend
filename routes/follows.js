const router = require("express").Router();

const auth = require("../middlewares/auth");
const {
  validateFollowQuery,
  validateFollowUserId,
  validateFollowRequestId,
} = require("../middlewares/follow-validation");
const {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getFollowRequests,
  acceptFollowRequest,
  rejectFollowRequest,
  removeFollower,
  getFollowSummary,
} = require("../controllers/follows");

router.use(auth);

router.get("/summary", getFollowSummary);
router.get("/followers", validateFollowQuery, getFollowers);
router.get("/following", validateFollowQuery, getFollowing);
router.get("/requests", validateFollowQuery, getFollowRequests);

router.post(
  "/requests/:followId/accept",
  validateFollowRequestId,
  acceptFollowRequest,
);

router.delete(
  "/requests/:followId",
  validateFollowRequestId,
  rejectFollowRequest,
);

router.delete("/followers/:userId", validateFollowUserId, removeFollower);

router.post("/users/:userId", validateFollowUserId, followUser);

router.delete("/users/:userId", validateFollowUserId, unfollowUser);

module.exports = router;
