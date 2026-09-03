const { celebrate, Joi, Segments } = require("celebrate");

const httpUrl = Joi.string().uri({
  scheme: ["http", "https"],
});

const password = Joi.string()
  .min(8)
  .max(72)
  .pattern(/[a-z]/)
  .pattern(/[A-Z]/)
  .pattern(/[0-9]/)
  .required()
  .messages({
    "string.pattern.base":
      "Password must contain uppercase, lowercase, and numeric characters",
  });

const validateRegistration = celebrate({
  [Segments.BODY]: Joi.object({
    name: Joi.string().trim().min(2).max(40).required(),
    about: Joi.string().trim().max(200).optional(),
    avatar: httpUrl.allow("").optional(),
    email: Joi.string().trim().lowercase().email().max(254).required(),
    password,
  }).required(),
});

const validateLogin = celebrate({
  [Segments.BODY]: Joi.object({
    email: Joi.string().trim().lowercase().email().max(254).required(),
    password: Joi.string().min(1).max(72).required(),
  }).required(),
});

const validateProfileUpdate = celebrate({
  [Segments.BODY]: Joi.object({
    name: Joi.string().trim().min(2).max(40),
    about: Joi.string().trim().max(200),
    avatar: httpUrl.allow(""),
    isPrivate: Joi.boolean(),
  })
    .min(1)
    .required(),
});

module.exports = {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
};
