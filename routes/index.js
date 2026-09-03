const router = require("express").Router();

const authRouter = require("./auth");
const bookmarksRouter = require("./bookmarks");
const collectionsRouter = require("./collections");
const commentsRouter = require("./comments");
const followsRouter = require("./follows");
const postsRouter = require("./posts");
const usersRouter = require("./users");

router.use("/auth", authRouter);
router.use("/bookmarks", bookmarksRouter);
router.use("/collections", collectionsRouter);
router.use("/comments", commentsRouter);
router.use("/follows", followsRouter);
router.use("/posts", postsRouter);
router.use("/users", usersRouter);

module.exports = router;
