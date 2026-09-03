const { celebrate, Joi, Segments } = require("celebrate");

const objectId = Joi.string().hex().length(24);

const securePassword = Joi.string()
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

const validateUserSearch = celebrate({
  [Segments.QUERY]: Joi.object({
    search: Joi.string().trim().min(1).max(40).required(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(20),
  }),
});

const validateUserId = celebrate({
  [Segments.PARAMS]: Joi.object({
    userId: objectId.required(),
  }),
});

const validatePasswordChange = celebrate({
  [Segments.BODY]: Joi.object({
    currentPassword: Joi.string().min(1).max(72).required(),
    newPassword: securePassword,
  }).required(),
});

const validateAccountDeletion = celebrate({
  [Segments.BODY]: Joi.object({
    password: Joi.string().min(1).max(72).required(),
  }).required(),
});

module.exports = {
  validateUserSearch,
  validateUserId,
  validatePasswordChange,
  validateAccountDeletion,
};
