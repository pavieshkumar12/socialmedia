const { date } = require("joi");
const mongoose = require("mongoose");

const userPostSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users", // Reference to the User model
      required: true,
    },
    postVisiblity: {
      type: String,
      enum: ["Public", "OnlyFollowers", "Myself"],
      default: "Public",
      required: false,
    },
    category: {
      type: [String],
      required: false,
      default: [],
    },
    tags: {
      type: [String],
      required: false,
      default: [],
    },
    gif: {
      type: [String],
      required: false,
      default: [],
    },
    description: {
      type: String,
      required: false,
      default: "",
    },
    pollDuration: {
      type: Date,
    },
    attachments: [
      {
        type: String,
        required: false,
      },
    ],
    Bullish: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Users",
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    Bearish: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Users",
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    comments: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Users",
        },
        details: {
          type: String,
        },
        replayUserId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Users",
        },
        likes: {
          type: [mongoose.Schema.Types.ObjectId], // Define as an array
          default: [], // Set default value as an empty array
          ref: "Users",
        },
        disLikes: {
          type: [mongoose.Schema.Types.ObjectId], // Define as an array
          default: [], // Set default value as an empty array
          ref: "Users",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    createPoll: [
      {
        pollText: {
          type: String,
          required: true,
        },
        pollImage: {
          type: String,
          required: false,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    votes: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Users",
          required: false,
        },
        polloptionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Users",
          required: false,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    predictionToken: {
      type: String,
    },
    predictionDuration: {
      type: Date,
    },
    predictionPrice: {
      type: String,
    },
    predictionReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const userPost = mongoose.model("userPosts", userPostSchema);

module.exports = userPost;
