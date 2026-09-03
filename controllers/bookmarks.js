const mongoose = require("mongoose");

const {
  canViewPost,
  getAcceptedFollowingIds,
} = require("../utils/post-access");

const Bookmark = require("../models/bookmark");
const Collection = require("../models/collection");
const Post = require("../models/post");
const ForbiddenError = require("../errors/forbidden-error");
const NotFoundError = require("../errors/not-found-error");

const populateBookmark = (query) =>
  query
    .populate({
      path: "post",
      populate: {
        path: "owner",
        select: "name about avatar",
      },
    })
    .populate("collectionId", "name description visibility coverPost");

const findOwnedCollection = async (collectionId, userId) => {
  if (collectionId === null || collectionId === undefined) {
    return null;
  }

  const collection = await Collection.findById(collectionId);

  if (!collection) {
    throw new NotFoundError("Collection not found");
  }

  if (collection.owner.toString() !== userId.toString()) {
    throw new ForbiddenError(
      "Bookmarks can only be added to your own collections",
    );
  }

  return collection;
};

const getAccessibleBookmarkPage = async ({
  ownerId,
  role,
  page,
  limit,
  collectionId,
  tag,
}) => {
  const ownerObjectId = new mongoose.Types.ObjectId(ownerId);
  const bookmarkMatch = {
    owner: ownerObjectId,
  };

  if (collectionId) {
    bookmarkMatch.collectionId = new mongoose.Types.ObjectId(collectionId);
  }

  if (tag) {
    bookmarkMatch.tags = tag.toLowerCase();
  }

  const acceptedFollowingIds = await getAcceptedFollowingIds(ownerId);

  const postAccessExpression =
    role === "admin"
      ? { $eq: ["$_id", "$$postId"] }
      : {
          $and: [
            { $eq: ["$_id", "$$postId"] },
            {
              $or: [
                { $eq: ["$visibility", "public"] },
                { $eq: ["$owner", ownerObjectId] },
                {
                  $and: [
                    { $eq: ["$visibility", "followers"] },
                    { $in: ["$owner", acceptedFollowingIds] },
                  ],
                },
              ],
            },
          ],
        };

  const [result] = await Bookmark.aggregate([
    {
      $match: bookmarkMatch,
    },
    {
      $lookup: {
        from: Post.collection.name,
        let: {
          postId: "$post",
        },
        pipeline: [
          {
            $match: {
              $expr: postAccessExpression,
            },
          },
          {
            $project: {
              _id: 1,
            },
          },
        ],
        as: "accessiblePost",
      },
    },
    {
      $match: {
        "accessiblePost.0": {
          $exists: true,
        },
      },
    },
    {
      $sort: {
        createdAt: -1,
        _id: -1,
      },
    },
    {
      $facet: {
        bookmarkIds: [
          {
            $skip: (page - 1) * limit,
          },
          {
            $limit: limit,
          },
          {
            $project: {
              _id: 1,
            },
          },
        ],
        metadata: [
          {
            $count: "total",
          },
        ],
      },
    },
  ]);

  const ids = result.bookmarkIds.map(({ _id }) => _id);
  const total = result.metadata[0]?.total || 0;

  const bookmarkDocuments = await populateBookmark(
    Bookmark.find({
      _id: {
        $in: ids,
      },
    }),
  );

  const bookmarksById = new Map(
    bookmarkDocuments.map((bookmark) => [bookmark._id.toString(), bookmark]),
  );

  return {
    bookmarks: ids
      .map((id) => bookmarksById.get(id.toString()))
      .filter(Boolean),
    total,
  };
};

const getMyBookmarks = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 12;

  const { bookmarks, total } = await getAccessibleBookmarkPage({
    ownerId: req.user._id,
    role: req.user.role,
    page,
    limit,
    collectionId: req.query.collectionId,
    tag: req.query.tag,
  });

  res.send({
    bookmarks,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  });
};

const getBookmark = async (req, res) => {
  const bookmark = await populateBookmark(
    Bookmark.findOne({
      _id: req.params.bookmarkId,
      owner: req.user._id,
    }),
  );

  if (!bookmark || !bookmark.post) {
    throw new NotFoundError("Bookmark not found");
  }

  if (!(await canViewPost(bookmark.post, req.user))) {
    throw new NotFoundError("Bookmark not found");
  }

  res.send({
    bookmark,
  });
};

const createBookmark = async (req, res) => {
  const post = await Post.findById(req.body.postId);

  if (!post || !(await canViewPost(post, req.user))) {
    throw new NotFoundError("Post not found");
  }

  await findOwnedCollection(req.body.collectionId, req.user._id);

  const bookmark = await Bookmark.create({
    owner: req.user._id,
    post: post._id,
    collectionId: req.body.collectionId ?? null,
    note: req.body.note ?? "",
    tags: req.body.tags ?? [],
  });

  const populatedBookmark = await populateBookmark(
    Bookmark.findById(bookmark._id),
  );

  res.status(201).send({
    bookmark: populatedBookmark,
  });
};

const updateBookmark = async (req, res) => {
  const bookmark = await Bookmark.findOne({
    _id: req.params.bookmarkId,
    owner: req.user._id,
  });

  if (!bookmark) {
    throw new NotFoundError("Bookmark not found");
  }

  if (Object.hasOwn(req.body, "collectionId")) {
    await findOwnedCollection(req.body.collectionId, req.user._id);
  }

  Object.assign(bookmark, req.body);
  await bookmark.save();

  const populatedBookmark = await populateBookmark(
    Bookmark.findById(bookmark._id),
  );

  res.send({
    bookmark: populatedBookmark,
  });
};

const deleteBookmark = async (req, res) => {
  const bookmark = await Bookmark.findOne({
    _id: req.params.bookmarkId,
    owner: req.user._id,
  });

  if (!bookmark) {
    throw new NotFoundError("Bookmark not found");
  }

  await bookmark.deleteOne();
  res.status(204).send();
};

module.exports = {
  getMyBookmarks,
  getBookmark,
  createBookmark,
  updateBookmark,
  deleteBookmark,
};
