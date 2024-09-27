const User = require("../models/userModel");

const followUser = async (req, res, next) => {
  try {
    if (String(req.body.userId) === String(req.user._id)) {
      return res.status(401).json({ message: "You can't follow yourself" });
    }

    const user = await User.findById(req.user._id);
    const currentUser = await User.findById(req.body.userId);

    if (!user.followers.includes(req.body.userId)) {
      await user.updateOne({ $push: { followers: req.body.userId } });
      await currentUser.updateOne({ $push: { followings: req.user._id } });
      return res.status(200).json({ message: "User has been followed" });
    } else {
      return res.status(401).json({ message: "You already follow this user" });
    }
  } catch (err) {
    next(err);
  }
};

const unfollowUser = async (req, res, next) => {
  try {
    if (String(req.body.userId) === String(req.user._id)) {
      return res.status(401).json({ message: "You can't follow yourself" });
    }

    const user = await User.findById(req.user._id);

    const currentUser = await User.findById(req.body.userId);

    if (!user || !currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.followers.includes(req.body.userId)) {
      await user.updateOne({ $pull: { followers: req.body.userId } });
      await currentUser.updateOne({ $pull: { followings: req.user._id } });
      return res.status(200).json({ message: "User has been unfollowed" });
    } else {
      return res.status(403).json({ message: "You don't follow this user" });
    }
  } catch (err) {
    next(err);
  }
};

const userFollowingList = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Find the user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get the list of followings
    const followingList = await User.find({ _id: { $in: user.followings } });

    // Extract relevant information (name and image) from the followingList
    const formattedFollowingList = followingList.map(
      ({ _id, name, image }) => ({
        userId: _id,
        name,
        image,
      })
    );

    // Include the count in the response JSON
    const response = {
      count: formattedFollowingList.length,
      followings: formattedFollowingList,
    };

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

const userFollowerList = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find the user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get the list of followings
    const followerList = await User.find({ _id: { $in: user.followers } });

    // Extract relevant information (name and image) from the followingList
    const formattedFollowerList = followerList.map(({ _id, name, image }) => ({
      userId: _id,
      name,
      image,
    }));

    // Include the count in the response JSON
    const response = {
      count: formattedFollowerList.length,
      followers: formattedFollowerList,
    };

    res.status(200).json(response);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Internal Server Error", message: err.message });
  }
};

const getPopularUsers = async (req, res, next) => {
  try {
    // Find users with the highest number of followers (top 10)
    const popularUsers = await User.aggregate([
      {
        $project: {
          name: 1,
          image: 1,
          followersCount: { $size: "$followers" },
        },
      },
      { $sort: { followersCount: -1 } },
      { $limit: 10 },
    ]);

    res.status(200).json({ popularUsers });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  unfollowUser,
  userFollowingList,
  followUser,
  userFollowerList,
  getPopularUsers,
};
