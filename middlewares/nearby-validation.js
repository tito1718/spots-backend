const { celebrate, Joi, Segments } = require("celebrate");

const validateNearbyPostQuery = celebrate({
  [Segments.QUERY]: Joi.object({
    longitude: Joi.number().min(-180).max(180).required(),
    latitude: Joi.number().min(-90).max(90).required(),
    radiusKm: Joi.number().min(0.1).max(200).default(25),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(12),
    tag: Joi.string().trim().min(1).max(40),
  }),
});

module.exports = {
  validateNearbyPostQuery,
};
