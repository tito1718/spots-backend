const router = require("express").Router();
const { rateLimit } = require("express-rate-limit");

const { register, login, refresh, logout } = require("../controllers/auth");
const {
  validateRegistration,
  validateLogin,
} = require("../middlewares/validation");

const credentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Too many authentication attempts. Please try again later.",
  },
});

router.post("/register", credentialLimiter, validateRegistration, register);
router.post("/login", credentialLimiter, validateLogin, login);
router.post("/refresh", refresh);
router.post("/logout", logout);

module.exports = router;
