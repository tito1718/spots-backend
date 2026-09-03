const { celebrate, Joi, Segments } = require("celebrate");

const objectId = Joi.string().hex().length(24);

const validateCollectionId = celebrate({
  [Segments.PARAMS]: Joi.object({
    collectionId: objectId.required(),
  }),
});

const validateCollectionQuery = celebrate({
  [Segments.QUERY]: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(20),
  }),
});

const validateCollectionCreation = celebrate({
  [Segments.BODY]: Joi.object({
    name: Joi.string().trim().min(1).max(60).required(),
    description: Joi.string().trim().max(300).allow("").default(""),
    visibility: Joi.string().valid("private", "public").default("private"),
    coverPost: objectId.allow(null).default(null),
  }).required(),
});

const validateCollectionUpdate = celebrate({
  [Segments.BODY]: Joi.object({
    name: Joi.string().trim().min(1).max(60),
    description: Joi.string().trim().max(300).allow(""),
    visibility: Joi.string().valid("private", "public"),
    coverPost: objectId.allow(null),
  })
    .min(1)
    .required(),
});

module.exports = {
  validateCollectionId,
  validateCollectionQuery,
  validateCollectionCreation,
  validateCollectionUpdate,
};
