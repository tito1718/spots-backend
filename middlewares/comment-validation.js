const { celebrate, Joi, Segments } = require("celebrate");

const objectId = Joi.string().hex().length(24);

const validateCommentPostId = celebrate({
  [Segments.PARAMS]: Joi.object({
    postId: objectId.required(),
  }),
});

const validateCommentId = celebrate({
  [Segments.PARAMS]: Joi.object({
    commentId: objectId.required(),
  }),
});

const validateCommentQuery = celebrate({
  [Segments.QUERY]: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(20),
    sort: Joi.string().valid("latest", "oldest").default("latest"),
  }),
});

const validateCommentCreation = celebrate({
  [Segments.BODY]: Joi.object({
    body: Joi.string().trim().min(1).max(2000).required(),
  }).required(),
});

const validateCommentUpdate = celebrate({
  [Segments.BODY]: Joi.object({
    body: Joi.string().trim().min(1).max(2000).required(),
  }).required(),
});

module.exports = {
  validateCommentPostId,
  validateCommentId,
  validateCommentQuery,
  validateCommentCreation,
  validateCommentUpdate,
};
