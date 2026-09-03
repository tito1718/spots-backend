const router = require("express").Router();

const authRouter = require("./auth");
const postsRouter = require("./posts");
const usersRouter = require("./users");

router.use("/auth", authRouter);
router.use("/posts", postsRouter);
router.use("/users", usersRouter);

module.exports = router;
