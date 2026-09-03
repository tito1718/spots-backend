const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const Bookmark = require("../models/bookmark");
const Collection = require("../models/collection");

const ownerId = new mongoose.Types.ObjectId();
const postId = new mongoose.Types.ObjectId();

test("normalizes collection names for duplicate protection", async () => {
  const collection = new Collection({
    owner: ownerId,
    name: "  New York Inspiration  ",
    description: "Places to visit around New York",
  });

  await collection.validate();

  assert.equal(collection.name, "New York Inspiration");
  assert.equal(collection.nameKey, "new york inspiration");
  assert.equal(collection.visibility, "private");
});

test("rejects unsupported collection visibility", async () => {
  const collection = new Collection({
    owner: ownerId,
    name: "Travel",
    visibility: "followers",
  });

  await assert.rejects(collection.validate(), /not a valid enum value/);
});

test("accepts a bookmark with private notes and tags", async () => {
  const bookmark = new Bookmark({
    owner: ownerId,
    post: postId,
    note: "Visit this location during sunset",
    tags: ["Travel", "Photography"],
  });

  await bookmark.validate();

  assert.equal(bookmark.collectionId, null);
  assert.deepEqual(bookmark.tags, ["travel", "photography"]);
});

test("rejects bookmark notes longer than 1000 characters", async () => {
  const bookmark = new Bookmark({
    owner: ownerId,
    post: postId,
    note: "a".repeat(1001),
  });

  await assert.rejects(
    bookmark.validate(),
    /longer than the maximum allowed length/,
  );
});

test("rejects more than ten bookmark tags", async () => {
  const bookmark = new Bookmark({
    owner: ownerId,
    post: postId,
    tags: Array.from({ length: 11 }, (_, index) => `tag-${index}`),
  });

  await assert.rejects(
    bookmark.validate(),
    /A bookmark cannot contain more than 10 tags/,
  );
});

test("does not expose normalized collection keys", async () => {
  const collection = new Collection({
    owner: ownerId,
    name: "Architecture",
  });

  await collection.validate();

  const serialized = JSON.parse(JSON.stringify(collection));

  assert.equal(serialized.nameKey, undefined);
});
