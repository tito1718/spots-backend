const router = require("express").Router();

const { getCurrentUser, updateCurrentUser } = require("../controllers/users");
const auth = require("../middlewares/auth");
const { validateProfileUpdate } = require("../middlewares/validation");

router.use(auth);

router.get("/me", getCurrentUser);
router.patch("/me", validateProfileUpdate, updateCurrentUser);

module.exports = router;
