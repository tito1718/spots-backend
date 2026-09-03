const mongoose = require("mongoose");

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    actor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      validate: {
        validator(value) {
          if (!this.recipient || !value) {
            return true;
          }

          return value.toString() !== this.recipient.toString();
        },
        message: "Users cannot notify themselves",
      },
    },
    type: {
      type: String,
      required: true,
      enum: ["follow_request", "follow_accepted", "post_like", "post_comment"],
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
    comment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    follow: {
      type: Schema.Types.ObjectId,
      ref: "Follow",
      default: null,
    },
    readAt: {
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

notificationSchema.index({
  recipient: 1,
  createdAt: -1,
  _id: -1,
});

notificationSchema.index({
  recipient: 1,
  readAt: 1,
  createdAt: -1,
});

notificationSchema.index({
  actor: 1,
  createdAt: -1,
});

notificationSchema.index({
  post: 1,
});

notificationSchema.index({
  comment: 1,
});

notificationSchema.index({
  follow: 1,
});

module.exports = mongoose.model("Notification", notificationSchema);
