const User = require("../models/user");
const NotFoundError = require("../errors/not-found-error");

const getCurrentUser = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  res.send({ user });
};

const updateCurrentUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, req.body, {
    returnDocument: "after",
    runValidators: true,
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  res.send({ user });
};

module.exports = {
  getCurrentUser,
  updateCurrentUser,
};
