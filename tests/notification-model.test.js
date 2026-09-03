const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const Notification = require("../models/notification");

const createNotification = (overrides = {}) =>
  new Notification({
    recipient: new mongoose.Types.ObjectId(),
    actor: new mongoose.Types.ObjectId(),
    type: "post_like",
    post: new mongoose.Types.ObjectId(),
    ...overrides,
  });

test("accepts a valid post-like notification", async () => {
  const notification = createNotification();

  await notification.validate();

  assert.equal(notification.type, "post_like");
  assert.equal(notification.readAt, null);
});

test("accepts a comment notification with its references", async () => {
  const notification = createNotification({
    type: "post_comment",
    comment: new mongoose.Types.ObjectId(),
  });

  await notification.validate();

  assert.ok(notification.post);
  assert.ok(notification.comment);
});

test("accepts a follow-request notification", async () => {
  const notification = createNotification({
    type: "follow_request",
    post: null,
    follow: new mongoose.Types.ObjectId(),
  });

  await notification.validate();

  assert.equal(notification.type, "follow_request");
  assert.ok(notification.follow);
});

test("rejects unsupported notification types", async () => {
  const notification = createNotification({
    type: "unknown_event",
  });

  await assert.rejects(notification.validate(), (error) => {
    assert.equal(error.name, "ValidationError");
    assert.ok(error.errors.type);
    assert.equal(error.errors.type.kind, "enum");
    return true;
  });
});

test("prevents self-notifications", async () => {
  const userId = new mongoose.Types.ObjectId();
  const notification = createNotification({
    recipient: userId,
    actor: userId,
  });

  await assert.rejects(notification.validate(), (error) => {
    assert.equal(error.name, "ValidationError");
    assert.ok(error.errors.actor);
    assert.match(error.errors.actor.message, /cannot notify themselves/);
    return true;
  });
});

test("tracks notification read state", async () => {
  const notification = createNotification();

  assert.equal(notification.readAt, null);

  notification.readAt = new Date();
  await notification.validate();

  assert.ok(notification.readAt instanceof Date);
});

test("requires a recipient, actor, and event type", async () => {
  const notification = new Notification();

  await assert.rejects(notification.validate(), (error) => {
    assert.equal(error.name, "ValidationError");
    assert.ok(error.errors.recipient);
    assert.ok(error.errors.actor);
    assert.ok(error.errors.type);
    return true;
  });
});

test("does not expose the Mongoose version key", () => {
  const notification = createNotification();
  notification.__v = 0;

  const serialized = JSON.parse(JSON.stringify(notification));

  assert.equal(serialized.__v, undefined);
});
