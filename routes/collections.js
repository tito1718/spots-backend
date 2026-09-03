const router = require("express").Router();

const {
  getMyCollections,
  getCollection,
  createCollection,
  updateCollection,
  deleteCollection,
} = require("../controllers/collections");
const auth = require("../middlewares/auth");
const optionalAuth = require("../middlewares/optional-auth");
const {
  validateCollectionId,
  validateCollectionQuery,
  validateCollectionCreation,
  validateCollectionUpdate,
} = require("../middlewares/collection-validation");

router.get("/mine", auth, validateCollectionQuery, getMyCollections);
router.post("/", auth, validateCollectionCreation, createCollection);
router.get("/:collectionId", optionalAuth, validateCollectionId, getCollection);
router.patch(
  "/:collectionId",
  auth,
  validateCollectionId,
  validateCollectionUpdate,
  updateCollection,
);
router.delete("/:collectionId", auth, validateCollectionId, deleteCollection);

module.exports = router;
