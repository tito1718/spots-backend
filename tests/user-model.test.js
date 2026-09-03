const test = require("node:test");
const assert = require("node:assert/strict");

const User = require("../models/user");

const validUser = {
  name: "Spots Test User",
  about: "Photographer and traveler",
  avatar: "https://images.example.com/avatar.jpg",
  email: "spots@example.com",
  password: "SecurePassword123!",
};

test("accepts a valid user profile", async () => {
  const user = new User(validUser);

  await user.validate();

  assert.equal(user.name, validUser.name);
  assert.equal(user.email, validUser.email);
  assert.equal(user.role, "user");
  assert.equal(user.isPrivate, false);
});

test("rejects an invalid email address", async () => {
  const user = new User({
    ...validUser,
    email: "not-an-email",
  });

  await assert.rejects(user.validate(), /Email must be valid/);
});

test("rejects a password shorter than eight characters", async () => {
  const user = new User({
    ...validUser,
    password: "short",
  });

  await assert.rejects(
    user.validate(),
    /shorter than the minimum allowed length/,
  );
});

test("rejects an avatar without an HTTP or HTTPS URL", async () => {
  const user = new User({
    ...validUser,
    avatar: "javascript:alert(1)",
  });

  await assert.rejects(
    user.validate(),
    /Avatar must be a valid HTTP or HTTPS URL/,
  );
});

test("does not expose the password when serialized", () => {
  const user = new User(validUser);
  const serializedUser = JSON.parse(JSON.stringify(user));

  assert.equal(serializedUser.password, undefined);
});
