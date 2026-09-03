const { celebrate, Joi, Segments } = require("celebrate");

const objectId = Joi.string().hex().length(24);

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

module.exports = {
  validateUserSearch,
  validateUserId,
};
