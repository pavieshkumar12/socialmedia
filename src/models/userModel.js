const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    email: {
      type: String,
      default: null, // Replace with a unique string
    },
    phoneNumber: {
      type: String,
      default: null,
    },
    password: {
      type: String,
      required: function () {
        // Require password for non-Google and non-apple users
        return this.provider !== "google" && this.provider !== "apple";
      },
    },
    // confirmPassword: {
    //   type: String,
    //   required: false,
    // },
    image: {
      type: String,
      required: false,
      default: "",
    },
    yourName: {
      type: String,
      required: false,
      // default: "",
    },
    userName: {
      type: String,
      required: false,
      default: "",
    },
    gender: {
      type: String,
      default: "",
      required: false,
      enum: ["Male", "Female", "Others", ""],
    },
    dob: {
      type: String,
      default: "",
      required: false,
    },
    cryptoInterest: {
      type: String,
      default: "",
      required: false,
    },
    marketLevel: {
      type: String,
      default: "",
      required: false,
    },
    tradeExperience: {
      type: String,
      default: "",
      required: false,
      enum: ["Daily", "Weekly", "Monthly", "Rarely", ""], 
    },
    tradeVolume: {
      type: String,
      default: "",
      required: false,
    },
    otpCode: {
      type: Number,
      default: null,
      required: false,
    },
    passwordCode: {
      type: Number,
      default: null,
      required: false,
    },
    followers: {
      type: Array,
      default: [],
    },
    followings: {
      type: Array,
      default: [],
    },
    savePost: [
      {
        collectionName: {
          type: String,
          required: true,
        },
        collectionCover: {
          type: String,
          required: false,
          default: ""
        },
        postCollection: {
          type: Array,
          default: [],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
      
    ],
    provider: {
      type: String,
      enum: ["app", "google", "apple"],
      default: "app",
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // This will add createdAt and updatedAt fields
  }
);

const User = mongoose.model("Users", userSchema);

module.exports = User;
