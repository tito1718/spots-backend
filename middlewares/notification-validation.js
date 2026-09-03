const { celebrate, Joi, Segments } = require("celebrate");

const objectId = Joi.string().hex().length(24);

const validateNotificationQuery = celebrate({
  [Segments.QUERY]: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(20),
    unreadOnly: Joi.boolean().default(false),
  }),
});

const validateNotificationId = celebrate({
  [Segments.PARAMS]: Joi.object({
    notificationId: objectId.required(),
  }),
});

module.exports = {
  validateNotificationQuery,
  validateNotificationId,
};
