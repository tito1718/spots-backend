const mongoose = require("mongoose");

const { Schema } = mongoose;

const bookmarkSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    collectionId: {
      type: Schema.Types.ObjectId,
      ref: "Collection",
      default: null,
    },
    note: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
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
        message: "A bookmark cannot contain more than 10 tags",
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_document, returnedObject) {
        delete returnedObject.__v;
        return returnedObject;
      },
    },
  },
);

bookmarkSchema.index(
  {
    owner: 1,
    post: 1,
    collectionId: 1,
  },
  {
    unique: true,
  },
);

bookmarkSchema.index({
  owner: 1,
  createdAt: -1,
});

bookmarkSchema.index({
  collectionId: 1,
  createdAt: -1,
});

module.exports = mongoose.model("Bookmark", bookmarkSchema);
