const { celebrate, Joi, Segments } = require("celebrate");

const objectId = Joi.string().hex().length(24);

const validateFollowQuery = celebrate({
  [Segments.QUERY]: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(20),
  }),
});

const validateFollowUserId = celebrate({
  [Segments.PARAMS]: Joi.object({
    userId: objectId.required(),
  }),
});

const validateFollowRequestId = celebrate({
  [Segments.PARAMS]: Joi.object({
    followId: objectId.required(),
  }),
});

module.exports = {
  validateFollowQuery,
  validateFollowUserId,
  validateFollowRequestId,
};
