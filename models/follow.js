const mongoose = require("mongoose");

const { Schema } = mongoose;

const followSchema = new Schema(
  {
    follower: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    following: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      validate: {
        validator(value) {
          if (!this.follower || !value) {
            return true;
          }

          return value.toString() !== this.follower.toString();
        },
        message: "Users cannot follow themselves",
      },
    },
    status: {
      type: String,
      enum: ["pending", "accepted"],
      default: "pending",
    },
    acceptedAt: {
      type: Date,
      default: null,
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

followSchema.index(
  {
    follower: 1,
    following: 1,
  },
  {
    unique: true,
  },
);

followSchema.index({
  following: 1,
  status: 1,
  createdAt: -1,
});

followSchema.index({
  follower: 1,
  status: 1,
  createdAt: -1,
});

module.exports = mongoose.model("Follow", followSchema);
