const userPost = require("../models/userPostModel");
const User = require("../models/userModel");
const tags = require("../../uploads/tags");

const addNewPost = async (req, res, next) => {
  try {
    const updateFields = req.body;
    let attachments;

    // Check if req.files is present (multiple files)
    if (req.files) {
      // Use the paths from multer to store in the database
      attachments = req.files.map((file) => file.path);
    } else if (req.file) {
      // Single file
      attachments = req.file.path;
    }

    // Check if no fields other than attachments are provided
    const hasNoFieldsOtherThanAttachments =
      Object.keys(updateFields).length === 0 && !attachments;

    if (hasNoFieldsOtherThanAttachments) {
      return res.status(400).send({ message: "No fields provided for update" });
    }

    // If attachments are provided, update the attachments field
    if (attachments) {
      updateFields.attachments = attachments;
    }

    // Assuming 'userId' is the _id field in the User model
    const userId = req.user._id;

    updateFields.userId = userId;

    // Fetch user details from the User table based on _id (userId)
    const user = await User.findById(userId);

    // Check if the user exists
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    // Add the user's name to the updateFields
    updateFields.userName = user.name;
    updateFields.profilePic = user.image;

    // Create a new instance of the userPost model with updateFields
    const newPost = new userPost(updateFields);

    // Save the new post to the database
    const savedPost = await newPost.save();

    // Include userName in the response
    const response = {
      message: "Post added successfully",
      post: {
        ...savedPost.toObject(), // Convert to plain JavaScript object
        userName: user.name,
        profilePic: user.image,
      },
    };

    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
};

const addPoll = async (req, res, next) => {
  try {
    const {
      description,
      pollDuration,
      createPoll,
      gif,
      postVisiblity,
      tags,
      category,
    } = req.body;

    // Check if tags and category are present in the request body, if not, set them to empty arrays
    const tagsArray = tags || [];
    const categoryArray = category || [];

    if (!createPoll || createPoll.length === 0) {
      return res.status(400).send({ message: "Invalid createPoll data" });
    }

    let attachments;
    // Check if req.files is present (multiple files)
    if (req.files) {
      // Use the paths from multer to store in the database
      attachments = req.files.map((file) => file.path);
    } else if (req.file) {
      // Single file
      attachments = req.file.path;
    }

    // Assuming 'userId' is the _id field in the User model
    const userId = req.user._id;

    // Fetch user details from the User table based on _id (userId)
    const user = await User.findById(userId);

    // Check if the user exists
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const pollTime = new Date(pollDuration);

    const updateFields = {
      userId: userId,
      userName: user.name,
      profilePic: user.image,
      attachments: attachments,
      tags: tagsArray,
      category: categoryArray,
      pollDuration: pollTime,
      description: description,
      gif:gif,
      postVisiblity: postVisiblity,
      createPoll: createPoll.map((poll) => ({
        pollText: poll.pollText,
      })),
    };

    // Create a new instance of the userPost model with updateFields
    const newPost = new userPost(updateFields);

    // Save the new post to the database
    const savedPost = await newPost.save();

    const { ...postWithoutAttachments } = savedPost.toObject();

    // Include userName and description in the response
    const response = {
      message: "Poll added successfully",
      post: {
        ...postWithoutAttachments,
        userName: user.name,
        profilePic: user.image,
        attachments: attachments,
        description: description,
        postVisibility: postVisiblity,
        gif: gif,
        pollDuration: pollTime,
        tags: tagsArray,
        category: categoryArray,
      },
    };

    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
};

const votePoll = async (req, res, next) => {
  try {
    const polloptionId = req.params.polloptionId;

    // Find the userPost document for the given userId
    const userPollRecord = await userPost.findOne({
      "createPoll._id": polloptionId,
    });

    if (!userPollRecord) {
      return res.status(404).json({ message: "User poll option not found" });
    }

    // Check if the pollDuration has passed
    const currentTime = new Date();

    if (currentTime > userPollRecord.pollDuration) {
      // Calculate the final result
      const totalVotes = userPollRecord.votes.length;

      const percentages = userPollRecord.createPoll.map((polloption) => {
        const voteCount = userPollRecord.votes.filter(
          (vote) => vote.polloptionId.toString() === polloption._id.toString()
        ).length;

        const percentage = (voteCount / totalVotes) * 100;
        return {
          polloptionId: polloption._id,
          percentage: percentage,
        };
      });

      // Send the final result
      return res.status(200).json({
        message: "Voting has ended. Final results:",
        totalVotes: totalVotes,
        percentages: percentages,
      });
    }

    // Check if the user has already voted for this poll option
    const hasVoted = userPollRecord.votes.some(
      (vote) => vote.userId.toString() === req.user._id.toString()
    );

    if (hasVoted) {
      return res.status(400).json({
        message: "User has already voted for this poll option",
      });
    }

    // Add the user's vote to the votes array
    userPollRecord.votes.push({
      userId: req.user._id,
      polloptionId: polloptionId,
    });

    // Save the updated userPost document
    await userPollRecord.save();

    // Calculate the percentage for each polloptionId
    const totalVotes = userPollRecord.votes.length;
    const percentages = userPollRecord.createPoll.map((polloption) => {
      const voteCount = userPollRecord.votes.filter(
        (vote) => vote.polloptionId.toString() === polloption._id.toString()
      ).length;
      const percentage = (voteCount / totalVotes) * 100;
      return {
        polloptionId: polloption._id,
        percentage: percentage,
      };
    });

    // Send success message along with percentages
    res.status(200).json({
      message: "Your Vote Added",
      totalVotes: totalVotes,
      percentages: percentages,
    });
  } catch (err) {
    next(err);
  }
};

const editPost = async (req, res, next) => {
  try {
    const postId = req.params.postId;
    const updateFields = req.body;

    // Check if any fields other than attachments are provided for update
    const hasFieldsToUpdate =
      Object.keys(updateFields).some(
        (key) => key !== "attachments" && updateFields[key] !== undefined
      ) ||
      (req.files && Array.isArray(req.files) && req.files.length > 0);

    if (!hasFieldsToUpdate) {
      return res.status(400).send({ message: "No fields provided for update" });
    }

    // Fetch the existing post to get the current attachments
    const existingPost = await userPost.findById(postId);

    let attachments;

    // Check if req.files is present (multiple files)
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      // Use the paths from multer to store in the database
      attachments = req.files.map((file) => file.path);
    } else {
      // No new files provided, set attachments to an empty array
      attachments = [];
    }

    updateFields.attachments = attachments;

    const userId = req.user._id;

    // Fetch user details from the User table based on _id (userId)
    const user = await User.findById(userId);

    // Check if the user exists
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    // Add the user's name to the updateFields
    updateFields.userName = user.name;
    updateFields.profilePic = user.image;

    // Update the user with the provided fields
    const updatedUserPost = await userPost.findByIdAndUpdate(
      postId,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedUserPost) {
      return res.status(404).send({ message: "UserPost not found" });
    }

    const response = {
      message: "UserPost Edited successfully",
      post: {
        ...updatedUserPost.toObject(),
        userName: user.name,
        profilePic: user.image,
      },
    };

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const postId = req.params.postId;

    const deletedPost = await userPost.findByIdAndDelete(postId);

    if (!deletedPost) {
      return res.status(404).json({ message: "Post not found" });
    }
    return res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    next(err);
  }
};

const getUserFollowingPosts = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Step 1: Find the user by ID in the User model
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Step 2: Extract the followers array from the user document
    const followersArray = user.followers;

    // Step 3: Find posts in the userPost model where userId matches any of the IDs in the followers array
    const followingPosts = await userPost.find({
      userId: { $in: followersArray },
    });

    // Step 4: Fetch additional details for each post
    const enhancedFollowingPosts = await Promise.all(
      followingPosts.map(async (post) => {
        // Fetch user details (name, image) from the User model
        const userDetail = await User.findById(post.userId);

        // Fetch user details for Bullish array
        const bullishDetails = await Promise.all(
          post.Bullish.map(async (bullish) => {
            const bullishUserDetail = await User.findById(bullish.userId);
            return {
              userId: bullish.userId,
              userName: bullishUserDetail ? bullishUserDetail.name : null,
              userImage: bullishUserDetail ? bullishUserDetail.image : null,
            };
          })
        );

        // Fetch user details for bearish array
        const bearishDetails = await Promise.all(
          post.Bearish.map(async (bearish) => {
            const bearishUserDetail = await User.findById(bearish.userId);
            return {
              userId: bearish.userId,
              userName: bearishUserDetail ? bearishUserDetail.name : null,
              userImage: bearishUserDetail ? bearishUserDetail.image : null,
            };
          })
        );

        //Fetch user details for votes array
        const votesDetails = await Promise.all(
          post.votes.map(async (vote) => {
            const votesUserDetail = await User.findById(vote.userId);
            return {
              userId: vote.userId,
              userName: votesUserDetail ? votesUserDetail.name : null,
              userImage: votesUserDetail ? votesUserDetail.image : null,
            };
          })
        );

        // Fetch user details for comments array
        const commentsDetails = await Promise.all(
          post.comments.map(async (comment) => {
            const commentUserDetail = await User.findById(comment.userId);
            return {
              userId: comment.userId,
              userName: commentUserDetail ? commentUserDetail.name : null,
              userImage: commentUserDetail ? commentUserDetail.image : null,
              details: comment.details,
              createdAt: comment.createdAt,
            };
          })
        );

        commentsDetails.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        // Calculate Bullish, Bearish, and comments counts
        const bullishCount = post.Bullish.length;
        const bearishCount = post.Bearish.length;
        const commentsCount = post.comments.length;

        // Create an enhanced post object with additional details
        return {
          _id: post._id,
          userId: post.userId,
          userName: userDetail ? userDetail.name : null,
          userImage: userDetail ? userDetail.image : null,
          description: post.description,
          attachments: post.attachments,
          createPoll: post.createPoll,
          bullish: bullishDetails,
          bearish: bearishDetails,
          votes: votesDetails,
          comments: commentsDetails,
          bullishCount,
          bearishCount,
          commentsCount,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        };
      })
    );

    const sortedPosts = enhancedFollowingPosts.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return res.status(200).json({ followingPosts: sortedPosts });
  } catch (err) {
    next(err);
  }
};

const topTags = async (req, res, next) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000); // Calculate 24 hours ago
    const topTagsOverall = await userPost.aggregate([
      { $unwind: "$tags" },
      { $project: { tags: { $split: ["$tags", ","] } } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { _id: 0, tag: "$_id", count: 1 } },
    ]);

    const trendingTags = await userPost.aggregate([
      { $match: { createdAt: { $gte: twentyFourHoursAgo } } }, // Filter posts created within the last 24 hours
      { $unwind: "$tags" },
      { $project: { tags: { $split: ["$tags", ","] } } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { _id: 0, tag: "$_id", count: 1 } },
    ]);

    const topTagsOverallArray = topTagsOverall.map((tag) => tag.tag);
    const trendingTagsArray = trendingTags.map((tag) => tag.tag);

    res.status(200).json({
      TopTags: topTagsOverallArray,
      TrendingTags: trendingTagsArray,
    });
  } catch (err) {
    next(err);
  }
};

const searchTags = async (req, res, next) => {
  try {
    const { search } = req.query;

    // If search parameter is not provided, return all tags
    if (!search) {
      return res.json({ tags: tags });
    }

    // Split the search query into individual tags
    const searchTags = search.split(",").map((tag) => tag.trim());

    // Filter the tags array based on the search tags
    const matchingTags = tags.filter((tag) => {
      return searchTags.some((searchTag) =>
        tag.toLowerCase().includes(searchTag.toLowerCase())
      );
    });

    if (matchingTags.length === 0) {
      return res.status(404).json({ message: "No results found" });
    }

    res.json({ matchingTags });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  addNewPost,
  getUserFollowingPosts,
  editPost,
  deletePost,
  addPoll,
  votePoll,
  topTags,
  searchTags,
};
