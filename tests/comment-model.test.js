const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const Comment = require("../models/comment");

const createComment = (overrides = {}) =>
  new Comment({
    owner: new mongoose.Types.ObjectId(),
    post: new mongoose.Types.ObjectId(),
    body: "A thoughtful comment about this destination.",
    ...overrides,
  });

test("accepts a valid comment", async () => {
  const comment = createComment();

  await comment.validate();

  assert.equal(comment.body, "A thoughtful comment about this destination.");
});

test("trims comment text", async () => {
  const comment = createComment({
    body: "  Beautiful architecture and photography.  ",
  });

  await comment.validate();

  assert.equal(comment.body, "Beautiful architecture and photography.");
});

test("rejects an empty comment", async () => {
  const comment = createComment({
    body: "   ",
  });

  await assert.rejects(comment.validate(), (error) => {
    assert.equal(error.name, "ValidationError");
    assert.ok(error.errors.body);
    assert.equal(error.errors.body.kind, "required");
    return true;
  });
});

test("rejects comments longer than 2000 characters", async () => {
  const comment = createComment({
    body: "a".repeat(2001),
  });

  await assert.rejects(comment.validate(), (error) => {
    assert.equal(error.name, "ValidationError");
    assert.ok(error.errors.body);
    assert.equal(error.errors.body.kind, "maxlength");
    return true;
  });
});

test("requires a post and comment owner", async () => {
  const comment = new Comment({
    body: "Missing relationships",
  });

  await assert.rejects(comment.validate(), (error) => {
    assert.equal(error.name, "ValidationError");
    assert.ok(error.errors.owner);
    assert.ok(error.errors.post);
    assert.equal(error.errors.owner.kind, "required");
    assert.equal(error.errors.post.kind, "required");
    return true;
  });
});

test("tracks whether a comment has been edited", async () => {
  const comment = createComment();

  assert.equal(comment.editedAt, null);

  comment.editedAt = new Date();
  await comment.validate();

  assert.ok(comment.editedAt instanceof Date);
});

test("does not expose the Mongoose version key", () => {
  const comment = createComment();
  comment.__v = 0;

  const serialized = JSON.parse(JSON.stringify(comment));

  assert.equal(serialized.__v, undefined);
});
