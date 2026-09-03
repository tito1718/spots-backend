const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const Follow = require("../models/follow");

const createFollow = (overrides = {}) =>
  new Follow({
    follower: new mongoose.Types.ObjectId(),
    following: new mongoose.Types.ObjectId(),
    ...overrides,
  });

test("accepts a valid pending follow request", async () => {
  const follow = createFollow();

  await follow.validate();

  assert.equal(follow.status, "pending");
  assert.equal(follow.acceptedAt, null);
});

test("accepts an approved follow relationship", async () => {
  const acceptedAt = new Date();
  const follow = createFollow({
    status: "accepted",
    acceptedAt,
  });

  await follow.validate();

  assert.equal(follow.status, "accepted");
  assert.equal(follow.acceptedAt, acceptedAt);
});

test("rejects unsupported follow statuses", async () => {
  const follow = createFollow({
    status: "blocked",
  });

  await assert.rejects(follow.validate(), (error) => {
    assert.equal(error.name, "ValidationError");
    assert.ok(error.errors.status);
    assert.equal(error.errors.status.kind, "enum");
    return true;
  });
});

test("prevents users from following themselves", async () => {
  const userId = new mongoose.Types.ObjectId();
  const follow = createFollow({
    follower: userId,
    following: userId,
  });

  await assert.rejects(follow.validate(), (error) => {
    assert.equal(error.name, "ValidationError");
    assert.ok(error.errors.following);
    assert.match(error.errors.following.message, /cannot follow themselves/);
    return true;
  });
});

test("requires both sides of the follow relationship", async () => {
  const follow = new Follow();

  await assert.rejects(follow.validate(), (error) => {
    assert.equal(error.name, "ValidationError");
    assert.ok(error.errors.follower);
    assert.ok(error.errors.following);
    return true;
  });
});

test("does not expose the Mongoose version key", () => {
  const follow = createFollow();
  follow.__v = 0;

  const serialized = JSON.parse(JSON.stringify(follow));

  assert.equal(serialized.__v, undefined);
});
