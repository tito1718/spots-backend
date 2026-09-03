const { celebrate, Joi, Segments } = require("celebrate");

const httpUrl = Joi.string().uri({
  scheme: ["http", "https"],
});

const objectId = Joi.string().hex().length(24);

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

const image = Joi.object({
  url: httpUrl.required(),
  publicId: Joi.string().max(300).allow("").optional(),
  altText: Joi.string().trim().min(2).max(300).required(),
  width: Joi.number().integer().min(1).optional(),
  height: Joi.number().integer().min(1).optional(),
}).required();

const location = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  placeId: Joi.string().max(300).allow("").optional(),
  point: Joi.object({
    type: Joi.string().valid("Point").default("Point"),
    coordinates: Joi.array()
      .ordered(
        Joi.number().min(-180).max(180).required(),
        Joi.number().min(-90).max(90).required(),
      )
      .length(2)
      .required(),
  }).required(),
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

const validatePostQuery = celebrate({
  [Segments.QUERY]: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(12),
    search: Joi.string().trim().min(1).max(100),
    tag: Joi.string().trim().min(1).max(40),
    sort: Joi.string().valid("latest", "oldest").default("latest"),
  }),
});

const validatePostId = celebrate({
  [Segments.PARAMS]: Joi.object({
    postId: objectId.required(),
  }),
});

const validatePostCreation = celebrate({
  [Segments.BODY]: Joi.object({
    caption: Joi.string().trim().min(2).max(2200).required(),
    image,
    location: location.optional(),
    tags: Joi.array()
      .items(Joi.string().trim().min(1).max(40))
      .max(10)
      .unique()
      .default([]),
    visibility: Joi.string()
      .valid("public", "followers", "private")
      .default("public"),
  }).required(),
});

module.exports = {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validatePostQuery,
  validatePostId,
  validatePostCreation,
};
