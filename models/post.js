const mongoose = require("mongoose");
const validator = require("validator");

const { Schema } = mongoose;

const imageSchema = new Schema(
  {
    url: {
      type: String,
      required: true,
      validate: {
        validator(value) {
          return validator.isURL(value, {
            protocols: ["http", "https"],
            require_protocol: true,
          });
        },
        message: "Image must have a valid HTTP or HTTPS URL",
      },
    },
    publicId: {
      type: String,
      default: "",
      maxlength: 300,
    },
    altText: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 300,
    },
    width: {
      type: Number,
      min: 1,
    },
    height: {
      type: Number,
      min: 1,
    },
  },
  {
    _id: false,
  },
);

const pointSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator(coordinates) {
          if (coordinates.length !== 2) {
            return false;
          }

          const [longitude, latitude] = coordinates;

          return (
            longitude >= -180 &&
            longitude <= 180 &&
            latitude >= -90 &&
            latitude <= 90
          );
        },
        message: "Coordinates must contain valid longitude and latitude",
      },
    },
  },
  {
    _id: false,
  },
);

const locationSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    placeId: {
      type: String,
      default: "",
      maxlength: 300,
    },
    point: {
      type: pointSchema,
      required: true,
    },
  },
  {
    _id: false,
  },
);

const postSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    caption: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 2200,
    },
    image: {
      type: imageSchema,
      required: true,
    },
    location: {
      type: locationSchema,
      default: undefined,
    },
    tags: {
      type: [
        {
          type: String,
          trim: true,
          lowercase: true,
          minlength: 1,
          maxlength: 40,
        },
      ],
      default: [],
      validate: {
        validator(tags) {
          return tags.length <= 10;
        },
        message: "A post cannot contain more than 10 tags",
      },
    },
    visibility: {
      type: String,
      enum: ["public", "followers", "private"],
      default: "public",
    },
    likedBy: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },
    editedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_document, returnedObject) {
        delete returnedObject.__v;
        return returnedObject;
      },
    },
  },
);

postSchema.virtual("likesCount").get(function getLikesCount() {
  return this.likedBy.length;
});

postSchema.virtual("commentCount", {
  ref: "Comment",
  localField: "_id",
  foreignField: "post",
  count: true,
});

postSchema.index({ owner: 1, createdAt: -1 });
postSchema.index({ visibility: 1, createdAt: -1 });
postSchema.index({
  caption: "text",
  tags: "text",
  "location.name": "text",
});
postSchema.index({ "location.point": "2dsphere" });

module.exports = mongoose.model("Post", postSchema);
