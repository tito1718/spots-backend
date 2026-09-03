const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const Post = require("../models/post");

const validPost = {
  owner: new mongoose.Types.ObjectId(),
  caption: "Sunset over the Manhattan skyline",
  image: {
    url: "https://images.example.com/manhattan.jpg",
    publicId: "spots/posts/manhattan",
    altText: "Orange sunset above the Manhattan skyline",
    width: 1600,
    height: 1200,
  },
  location: {
    name: "Brooklyn Bridge Park, New York",
    placeId: "brooklyn-bridge-park",
    point: {
      type: "Point",
      coordinates: [-73.997, 40.7024],
    },
  },
  tags: ["New York", "Sunset"],
  visibility: "public",
};

test("accepts a complete location-aware post", async () => {
  const post = new Post(validPost);

  await post.validate();

  assert.equal(post.caption, validPost.caption);
  assert.equal(post.visibility, "public");
  assert.deepEqual(post.tags, ["new york", "sunset"]);
  assert.equal(post.likesCount, 0);
});

test("accepts a post without optional location data", async () => {
  const post = new Post({
    ...validPost,
    location: undefined,
  });

  await post.validate();

  assert.equal(post.location, undefined);
});

test("rejects an unsafe image URL", async () => {
  const post = new Post({
    ...validPost,
    image: {
      ...validPost.image,
      url: "javascript:alert(1)",
    },
  });

  await assert.rejects(
    post.validate(),
    /Image must have a valid HTTP or HTTPS URL/,
  );
});

test("rejects coordinates outside geographic limits", async () => {
  const post = new Post({
    ...validPost,
    location: {
      ...validPost.location,
      point: {
        type: "Point",
        coordinates: [-200, 95],
      },
    },
  });

  await assert.rejects(
    post.validate(),
    /Coordinates must contain valid longitude and latitude/,
  );
});

test("rejects unsupported visibility settings", async () => {
  const post = new Post({
    ...validPost,
    visibility: "everyone-on-earth",
  });

  await assert.rejects(post.validate(), /not a valid enum value/);
});

test("rejects more than ten tags", async () => {
  const post = new Post({
    ...validPost,
    tags: Array.from({ length: 11 }, (_, index) => `tag-${index}`),
  });

  await assert.rejects(
    post.validate(),
    /A post cannot contain more than 10 tags/,
  );
});

test("provides a calculated like count without storing one", () => {
  const post = new Post({
    ...validPost,
    likedBy: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
  });

  assert.equal(post.likesCount, 2);
});
