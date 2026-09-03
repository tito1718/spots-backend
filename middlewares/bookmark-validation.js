const { celebrate, Joi, Segments } = require("celebrate");

const objectId = Joi.string().hex().length(24);

const bookmarkFields = {
  collectionId: objectId.allow(null),
  note: Joi.string().trim().max(1000).allow(""),
  tags: Joi.array().items(Joi.string().trim().min(1).max(40)).max(10).unique(),
};

const validateBookmarkQuery = celebrate({
  [Segments.QUERY]: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(12),
    collectionId: objectId,
    tag: Joi.string().trim().min(1).max(40),
  }),
});

const validateBookmarkId = celebrate({
  [Segments.PARAMS]: Joi.object({
    bookmarkId: objectId.required(),
  }),
});

const validateBookmarkCreation = celebrate({
  [Segments.BODY]: Joi.object({
    postId: objectId.required(),
    ...bookmarkFields,
  }).required(),
});

const validateBookmarkUpdate = celebrate({
  [Segments.BODY]: Joi.object(bookmarkFields).min(1).required(),
});

module.exports = {
  validateBookmarkQuery,
  validateBookmarkId,
  validateBookmarkCreation,
  validateBookmarkUpdate,
};
