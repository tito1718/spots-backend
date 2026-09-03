const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const validator = require("validator");

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 40,
      trim: true,
    },
    about: {
      type: String,
      default: "Explorer",
      maxlength: 200,
      trim: true,
    },
    avatar: {
      type: String,
      default: "",
      validate: {
        validator(value) {
          return (
            value === "" ||
            validator.isURL(value, {
              protocols: ["http", "https"],
              require_protocol: true,
            })
          );
        },
        message: "Avatar must be a valid HTTP or HTTPS URL",
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      validate: {
        validator: validator.isEmail,
        message: "Email must be valid",
      },
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "moderator", "admin"],
      default: "user",
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_document, returnedObject) {
        delete returnedObject.password;
        return returnedObject;
      },
    },
  },
);

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.index({
  name: 1,
  _id: 1,
});

module.exports = mongoose.model("User", userSchema);
