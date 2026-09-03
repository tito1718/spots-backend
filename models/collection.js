const mongoose = require("mongoose");

const { Schema } = mongoose;

const collectionSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 60,
    },
    nameKey: {
      type: String,
      required: true,
      trim: true,
      select: false,
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300,
    },
    visibility: {
      type: String,
      enum: ["private", "public"],
      default: "private",
    },
    coverPost: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_document, returnedObject) {
        delete returnedObject.__v;
        delete returnedObject.nameKey;
        return returnedObject;
      },
    },
  },
);

collectionSchema.pre("validate", function normalizeName() {
  if (this.isModified("name")) {
    this.nameKey = this.name.trim().toLowerCase();
  }
});

collectionSchema.index(
  {
    owner: 1,
    nameKey: 1,
  },
  {
    unique: true,
  },
);

collectionSchema.index({
  owner: 1,
  createdAt: -1,
});

module.exports = mongoose.model("Collection", collectionSchema);
