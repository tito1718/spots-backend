const Bookmark = require("../models/bookmark");
const Collection = require("../models/collection");
const ForbiddenError = require("../errors/forbidden-error");
const NotFoundError = require("../errors/not-found-error");

const assertCanManageCollection = (collection, user) => {
  if (
    collection.owner.toString() !== user._id.toString() &&
    user.role !== "admin"
  ) {
    throw new ForbiddenError(
      "Only the collection owner can modify this collection",
    );
  }
};

const getBookmarkCounts = async (collectionIds) => {
  const counts = await Bookmark.aggregate([
    {
      $match: {
        collectionId: {
          $in: collectionIds,
        },
      },
    },
    {
      $group: {
        _id: "$collectionId",
        count: {
          $sum: 1,
        },
      },
    },
  ]);

  return new Map(counts.map(({ _id, count }) => [_id.toString(), count]));
};

const serializeCollection = (collection, bookmarkCount = 0) => ({
  ...collection.toJSON(),
  bookmarkCount,
});

const getMyCollections = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const query = {
    owner: req.user._id,
  };

  const [collections, total] = await Promise.all([
    Collection.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Collection.countDocuments(query),
  ]);

  const counts = await getBookmarkCounts(
    collections.map((collection) => collection._id),
  );

  res.send({
    collections: collections.map((collection) =>
      serializeCollection(
        collection,
        counts.get(collection._id.toString()) || 0,
      ),
    ),
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

const getCollection = async (req, res) => {
  const collection = await Collection.findById(
    req.params.collectionId,
  ).populate("owner", "name about avatar");

  const ownerId = collection?.owner?._id?.toString();
  const currentUserId = req.user?._id?.toString();
  const canView =
    collection &&
    (collection.visibility === "public" ||
      ownerId === currentUserId ||
      req.user?.role === "admin");

  if (!canView) {
    throw new NotFoundError("Collection not found");
  }

  const bookmarkCount = await Bookmark.countDocuments({
    collectionId: collection._id,
  });

  res.send({
    collection: serializeCollection(collection, bookmarkCount),
  });
};

const createCollection = async (req, res) => {
  const collection = await Collection.create({
    ...req.body,
    owner: req.user._id,
  });

  res.status(201).send({
    collection: serializeCollection(collection),
  });
};

const updateCollection = async (req, res) => {
  const collection = await Collection.findById(req.params.collectionId);

  if (!collection) {
    throw new NotFoundError("Collection not found");
  }

  assertCanManageCollection(collection, req.user);
  Object.assign(collection, req.body);
  await collection.save();

  res.send({
    collection: serializeCollection(collection),
  });
};

const deleteCollection = async (req, res) => {
  const collection = await Collection.findById(req.params.collectionId);

  if (!collection) {
    throw new NotFoundError("Collection not found");
  }

  assertCanManageCollection(collection, req.user);

  await Bookmark.deleteMany({
    collectionId: collection._id,
  });
  await collection.deleteOne();

  res.status(204).send();
};

module.exports = {
  getMyCollections,
  getCollection,
  createCollection,
  updateCollection,
  deleteCollection,
};
