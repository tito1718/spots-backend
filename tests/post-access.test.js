const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const { canViewPost } = require("../utils/post-access");

const ownerId = new mongoose.Types.ObjectId();
const visitorId = new mongoose.Types.ObjectId();

test("allows anonymous access to public posts", async () => {
  const result = await canViewPost(
    {
      owner: ownerId,
      visibility: "public",
    },
    undefined,
  );

  assert.equal(result, true);
});

test("denies anonymous access to follower-only posts", async () => {
  const result = await canViewPost(
    {
      owner: ownerId,
      visibility: "followers",
    },
    undefined,
  );

  assert.equal(result, false);
});

test("allows owners to access their follower-only posts", async () => {
  const result = await canViewPost(
    {
      owner: ownerId,
      visibility: "followers",
    },
    {
      _id: ownerId,
      role: "user",
    },
  );

  assert.equal(result, true);
});

test("allows owners to access their private posts", async () => {
  const result = await canViewPost(
    {
      owner: {
        _id: ownerId,
      },
      visibility: "private",
    },
    {
      _id: ownerId,
      role: "user",
    },
  );

  assert.equal(result, true);
});

test("allows administrators to access private posts", async () => {
  const result = await canViewPost(
    {
      owner: ownerId,
      visibility: "private",
    },
    {
      _id: visitorId,
      role: "admin",
    },
  );

  assert.equal(result, true);
});
