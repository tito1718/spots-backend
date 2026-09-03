const router = require("express").Router();

const authRouter = require("./auth");
const collectionsRouter = require("./collections");
const postsRouter = require("./posts");
const usersRouter = require("./users");

router.use("/auth", authRouter);
router.use("/collections", collectionsRouter);
router.use("/posts", postsRouter);
router.use("/users", usersRouter);

module.exports = router;
