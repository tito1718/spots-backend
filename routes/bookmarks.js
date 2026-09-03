const router = require("express").Router();

const auth = require("../middlewares/auth");
const {
  validateBookmarkQuery,
  validateBookmarkId,
  validateBookmarkCreation,
  validateBookmarkUpdate,
} = require("../middlewares/bookmark-validation");
const {
  getMyBookmarks,
  getBookmark,
  createBookmark,
  updateBookmark,
  deleteBookmark,
} = require("../controllers/bookmarks");

router.use(auth);

router.get("/", validateBookmarkQuery, getMyBookmarks);
router.post("/", validateBookmarkCreation, createBookmark);

router.get("/:bookmarkId", validateBookmarkId, getBookmark);
router.patch(
  "/:bookmarkId",
  validateBookmarkId,
  validateBookmarkUpdate,
  updateBookmark,
);
router.delete("/:bookmarkId", validateBookmarkId, deleteBookmark);

module.exports = router;
