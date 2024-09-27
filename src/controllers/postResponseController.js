const User = require("../models/userModel");
const userPost = require("../models/userPostModel");

const getUserPostResponse = async (req, res, next) => {
  try {
    const postId = req.params.postId;

    const findPost = await userPost.findOne({ _id: postId });

    if (!findPost) {
      return res.status(404).json({ message: "Invalid postId" });
    }

    const Bullish = findPost.Bullish;
    const Bearish = findPost.Bearish;
    const comments = findPost.comments;
    const votes = findPost.votes;

    const usersBullish = await User.find({
      _id: { $in: Bullish.map((Bullish) => Bullish.userId) },
    });
    const usersBearish = await User.find({
      _id: { $in: Bearish.map((Bearish) => Bearish.userId) },
    });
    const commentUsers = await User.find({
      _id: { $in: comments.map((comment) => comment.userId) },
    });

    const votesUsers = await User.find({
      _id: { $in: votes.map((vote) => vote.userId) },
    });
    const BullishUsersInfo = usersBullish.map((user) => ({
      userId: user._id,
      name: user.name,
      image: user.image,
    }));

    const BearishUsersInfo = usersBearish.map((user) => ({
      userId: user._id,
      name: user.name,
      image: user.image,
    }));

    const commentUsersInfo = commentUsers.map((user) => ({
      userId: user._id,
      name: user.name,
      image: user.image,
    }));

    const voteUsersInfo = votesUsers.map((user) => ({
      userId: user._id,
      name: user.name,
      image: user.image,
    }));

    const commentsInfo = comments.map((comment) => ({
      commentId: comment._id,
      details: comment.details,
      createdAt: comment.createdAt,
      ...commentUsersInfo.find((user) => user.userId.equals(comment.userId)),
    }));

    commentsInfo.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const response = {
      postId: findPost._id,
      bullish: BullishUsersInfo,
      bearish: BearishUsersInfo,
      comments: commentsInfo,
      votes: voteUsersInfo,
      bullishCount: Bullish.length,
      bearishCount: Bearish.length,
      commentsCount: comments.length,
      votesCount: votes.length,
    };

    res.json(response);
  } catch (err) {
    next(err);
  }
};

const BullishPost = async (req, res, next) => {
  try {
    const post = await userPost.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const userId = req.user._id;

    const bearishIndex = post.Bearish.findIndex((bearish) =>
      bearish.userId.equals(userId)
    );

    const bullishIndex = post.Bullish.findIndex((bullish) =>
      bullish.userId.equals(userId)
    );

    if (bearishIndex !== -1) {
      // User is in Bearish array, remove from Bearish array
      post.Bearish.splice(bearishIndex, 1);

      // Add user to Bullish array
      if (bullishIndex === -1) {
        post.Bullish.push({
          userId: userId,
          createdAt: new Date(),
        });
      }

      await post.save();
      res
        .status(200)
        .json({ message: "Your Bearish Removed and Added To Bullish" });
    } else {
      // User is not in Bearish array, toggle Bullish array
      if (bullishIndex === -1) {
        post.Bullish.push({
          userId: userId,
          createdAt: new Date(),
        });
        await post.save();
        res.status(200).json({ message: "The Post has been Bullish" });
      } else {
        post.Bullish.splice(bullishIndex, 1);
        await post.save();
        res.status(200).json({ message: "Your Bullish Removed" });
      }
    }
  } catch (err) {
    next(err);
  }
};

const BearishPost = async (req, res, next) => {
  try {
    const post = await userPost.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const userId = req.user._id;

    const bullishIndex = post.Bullish.findIndex((bullish) =>
      bullish.userId.equals(userId)
    );

    const bearishIndex = post.Bearish.findIndex((Bearish) =>
      Bearish.userId.equals(userId)
    );

    if (bullishIndex !== -1) {
      // User is in Bullish array, remove from Bullish array
      post.Bullish.splice(bullishIndex, 1);

      // Add user to Bearish array
      if (bearishIndex === -1) {
        post.Bearish.push({
          userId: userId,
          createdAt: new Date(),
        });
      }
      await post.save();
      res
        .status(200)
        .json({ message: "Your Bullish Removed and Added To Bearish" });
    } else {
      // User is not in Bullish array, toggle Bearish array
      if (bearishIndex === -1) {
        post.Bearish.push({
          userId: userId,
          createdAt: new Date(),
        });
        await post.save();
        res.status(200).json({ message: "The Post has been Bearish" });
      } else {
        post.Bearish.splice(bearishIndex, 1);
        await post.save();
        res.status(200).json({ message: "Your Bearish Removed" });
      }
    }
  } catch (err) {
    next(err);
  }
};

const addComment = async (req, res, next) => {
  try {
    const postId = req.params.postId;
    const { details } = req.body; // Extract details from request body

    const userId = req.user._id;

    // Find the post by postId
    const post = await userPost.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Add the new comment to the comments array
    post.comments.push({ userId, details, replayUserId: userId }); // Set replayUserId to userId

    // Save the updated post with the new comment
    await post.save();

    // Populate user information for the last added comment
    const populatedPost = await userPost
      .findOne({ _id: postId })
      .populate({
        path: "comments.userId",
        model: "Users",
        select: "name image", // Select the fields you want to retrieve
      })
      .select("comments");

    // Extract the last comment after the populate and select operations
    const lastComment = populatedPost.comments.slice(-1)[0];

    // Respond with postId and details of the new comment including user information
    res.status(200).json({
      messege: "Comment Added",
      postId,
      newComment: lastComment, // Extract the populated comment
    });
  } catch (err) {
    next(err);
  }
};

const likeComment = async (req, res, next) => {
  try {
    const commentId = req.params.commentId;

    // Find the user post containing the comment
    const userPostRecord = await userPost.findOne({
      "comments._id": commentId,
    });

    if (!userPostRecord) {
      return res.status(404).json({ message: "Userpost not found" });
    }

    // Find the comment within the comments array
    const comment = userPostRecord.comments.find(
      (comment) => comment._id.toString() === commentId
    );

    // Check if the comment exists
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Remove req.user._id from disLikes array if it exists
    const userIdString = req.user._id.toString();
    const dislikeIndex = comment.disLikes.indexOf(userIdString);
    if (dislikeIndex !== -1) {
      comment.disLikes.splice(dislikeIndex, 1);
    }

    // Check if the user has already liked the comment
    if (comment.likes.includes(userIdString)) {
      return res
        .status(400)
        .json({ message: "You have already liked this comment" });
    }

    // Add the user's ID to the likes array of the comment
    comment.likes.push(userIdString);

    // Save the updated user post record
    await userPostRecord.save();

    // Calculate the count of likes
    const likesCount = comment.likes.length;

    // You can send a success response if needed
    res.json({ message: "You liked the comment", likesCount });
  } catch (err) {
    next(err);
  }
};

const dislikeComment = async (req, res, next) => {
  try {
    const commentId = req.params.commentId;

    // Find the user post containing the comment
    const userPostRecord = await userPost.findOne({
      "comments._id": commentId,
    });

    if (!userPostRecord) {
      return res.status(404).json({ message: "Userpost not found" });
    }
    // Find the comment within the comments array
    const comment = userPostRecord.comments.find(
      (comment) => comment._id.toString() === commentId
    );

    //Check if the comment exists
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    //Remove req.user._id from likes array if it erxits
    const userIdString = req.user._id.toString();
    const likeIndex = comment.likes.indexOf(userIdString);
    if (likeIndex !== -1) {
      comment.likes.splice(likeIndex, 1);
    }

    // Check if the user has already disliked the comment
    if (comment.disLikes.includes(userIdString)) {
      return res
        .status(400)
        .json({ message: "You have already disliked this comment" });
    }

    // Add the user's ID to the likes array of the comment
    comment.disLikes.push(userIdString);

    // Save the updated user post record
    await userPostRecord.save();

    // Calculate the count of dislikes
    const dislikesCount = comment.disLikes.length;

    // You can send a success response if needed
    res.json({ message: "You disliked the comment", dislikesCount });
  } catch (err) {
    next(err);
  }
};
const editComment = async (req, res, next) => {
  try {
    const commentId = req.params.commentId;
    const { details } = req.body;

    // Find the user post containing the comment
    const userPostRecord = await userPost.findOne({
      "comments._id": commentId,
    });

    if (!userPostRecord) {
      return res
        .status(404)
        .json({ message: "User post or comment not found" });
    }

    // Find the comment in the comments array
    const comment = userPostRecord.comments.find(
      (comment) => comment._id.toString() === commentId
    );

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Update the comment details and set a new createdAt time
    comment.details = details;
    comment.createdAt = new Date();

    // Save the updated user post
    await userPostRecord.save();

    // Find the user details (name and image) using the userId in the comment
    const user = await User.findById(comment.userId, { name: 1, image: 1 });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Respond with the user details (name and image) and the updated comment
    res.json({ messege: "Your Comment Edited", user, updatedComment: comment });
  } catch (err) {
    next(err);
  }
};

const replayComment = async (req, res, next) => {
  try {
    const commentId = req.params.commentId;
    const { replay } = req.body;

    // Find the user post containing the comment
    const userPostRecord = await userPost.findOne({
      "comments._id": commentId,
    });

    if (!userPostRecord) {
      return res
        .status(404)
        .json({ message: "User post or comment not found" });
    }

    // Find the comment with the specified commentId
    const foundComment = userPostRecord.comments.find(
      (comment) => comment._id.toString() === commentId
    );

    if (!foundComment) {
      return res
        .status(404)
        .json({ message: "Comment not found in user post" });
    }

    userPostRecord.comments.push({
      userId: foundComment.userId,
      replayUserId: req.user._id,
      details: replay,
      createdAt: new Date(),
    });

    // Save the updated userPostRecord
    await userPostRecord.save();

    // Find the user details (name and image) using the userId in the comment
    const user = await User.findById(req.user._id, { name: 1, image: 1 });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // You can send a success response if needed
    res.json({ messege: "Your replied", user, replayComment: foundComment });
  } catch (err) {
    next(err);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const commentId = req.params.commentId;

    const userPostRecord = await userPost.findOne({
      "comments._id": commentId,
    });

    if (!userPostRecord) {
      return res
        .status(404)
        .json({ message: "User post or comment not found" });
    }

    // Use $pull to remove the comment from the comments array
    userPostRecord.comments.pull({ _id: commentId });

    // Save the updated user post without the deleted comment
    await userPostRecord.save();

    res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    next(err);
  }
};

const savedPost = async (req, res, next) => {
  try {
    const postId = req.params.postId;
    const collectionId = req.body.collectionId;
    const userId = req.user._id;

    // Retrieve the user document
    const user = await User.findById(userId);

    // Check if user document exists
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find the collection with the specified collectionId
    const collection = user.savePost.find(collection => collection._id.toString() === collectionId);

    // Check if postId already exists in the postCollection
    const postIndex = collection.postCollection.indexOf(postId);

    // If postId exists, remove it; otherwise, add it
    if (postIndex !== -1) {
      collection.postCollection.splice(postIndex, 1);
      await user.save();
      return res.status(200).json({ message: 'Post removed successfully' });
    } else {
      collection.postCollection.push(postId);
      await user.save();
      return res.status(200).json({ message: 'Post saved successfully' });
    }

  } catch (err) {
    next(err);
  }
};

const createCollection = async (req, res, next) => {
  try {
    // Extract savePost array from request body
    const { savePost } = req.body;

    if (!savePost || savePost.length === 0) {
      return res.status(400).send({ message: "Invalid savePost data" });
    }

    let collectionCovers = [];
    // Check if req.files is present (multiple files)
    if (req.files && req.files.length > 0) {
      // Use the paths from multer to store in the database
      collectionCovers = req.files.map((file) => file.path);
    }

    const userId = req.user._id; // Assuming user ID is stored in req.user.id after authentication

    // Find the user by ID
    const user = await User.findById(userId);

    // If user is not found, return an error
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user's savePost array
    user.savePost = savePost.map((item, index) => ({
      collectionName: item.collectionName,
      collectionCover: collectionCovers[index] || null, // Use collectionCovers if available, otherwise null
    }));

    // Save the updated user to the database
    await user.save();

    // Construct response data
    const responseData = {
      message: "SavePost array stored successfully",

      savePost: user.savePost,
    };

    return res.status(200).json(responseData);
  } catch (err) {
    next(err);
  }
};

const editCollection = async (req, res, next) => {
  try {
    const collectionId = req.params.collectionId;
    const { savePost } = req.body;

    if (!savePost || savePost.length === 0) {
      return res.status(400).send({ message: "Invalid savePost data" });
    }

    const collectionRecord = await User.findOne({
      "savePost._id": collectionId,
    });

    if (!collectionRecord) {
      return res.status(404).json({ message: "User Collection is not found" });
    }

    const collectionIndex = collectionRecord.savePost.findIndex(
      (item) => item._id.toString() === collectionId
    );

    if (collectionIndex === -1) {
      return res.status(404).json({ message: "Collection not found" });
    }

    // Update collection data
    if (savePost[collectionIndex].collectionName !== undefined) {
      collectionRecord.savePost[collectionIndex].collectionName =
        savePost[collectionIndex].collectionName;
    }

    if (savePost[collectionIndex].collectionCover !== undefined) {
      collectionRecord.savePost[collectionIndex].collectionCover =
        savePost[collectionIndex].collectionCover;
    }

    // Save changes
    await collectionRecord.save();

    // Return updated collection
    res.status(200).json({
      message: "Collection updated successfully",
      collection: collectionRecord.savePost[collectionIndex],
    });
  } catch (err) {
    next(err);
  }
};

const deleteCollection = async(req,res,next)=>{
  try {
    const collectionId = req.params.collectionId;
    const userId = req.user.id; // Assuming you're using some sort of authentication middleware to get the user ID
    
    // Update the user document to remove the specified collection from savePost array
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $pull: { savePost: { _id: collectionId } } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Collection deleted successfully"});

  } catch (err) {
    next(err)
  }
}

module.exports = {
  getUserPostResponse,
  BullishPost,
  BearishPost,
  addComment,
  likeComment,
  dislikeComment,
  editComment,
  deleteComment,
  savedPost,
  replayComment,
  createCollection,
  editCollection,
  deleteCollection
};
