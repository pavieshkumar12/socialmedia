const express = require("express");
const {
  addNewPost,
  getUserFollowingPosts,
  editPost,
  deletePost,
  addPoll,
  votePoll,
  topTags,
  searchTags
} = require("../controllers/userPostController");
const { protect } = require("../controllers/userController");
const { celebrate, Joi, errors, Segments } = require("celebrate");
const { upload, handleUploadError } = require("../utils/multer");

const router = express.Router();

router.get("/getUserFollowingPosts", protect, getUserFollowingPosts);

router.post(
  "/addPost",
  upload.array("attachments", 10),
  handleUploadError,
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      description: Joi.string().optional(),
      category: Joi.array().items(Joi.string()).optional(),
      tags: Joi.array().items(Joi.string()).optional(),
      gif: Joi.array().items(Joi.string()).optional(),
      attachments: Joi.array().items(Joi.string()).optional(),
      postVisiblity: Joi.string().optional(),
    }),
  }),
  protect,
  addNewPost
);

router.post(
  "/addPoll",
  upload.any(),
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      description: Joi.string().required(),
      postVisiblity: Joi.string().optional(),
      category: Joi.array().items(Joi.string()).optional(),
      attachments: Joi.array().items(Joi.string()).optional(),
      tags: Joi.array().items(Joi.string()).optional(),
      gif: Joi.array().items(Joi.string()).optional(),
      pollDuration: Joi.date().required(),
      createPoll: Joi.array()
        .items(
          Joi.object().keys({
            pollText: Joi.string().required(),
          })
        )
        .required(),
    }),
  }),
  protect,
  addPoll
);

router.post(
  "/votePoll/:polloptionId",
  celebrate({
    [Segments.PARAMS]: {
      polloptionId: Joi.string().required(),
    },
  }),
  protect,
  votePoll
);


router.put(
  "/editPost/:postId",
  upload.array("attachments", 10),
  handleUploadError,
  celebrate({
    [Segments.PARAMS]: {
      postId: Joi.string().required(),
    },
    [Segments.BODY]: Joi.object().keys({
      description: Joi.string().allow("").optional(),
      postVisiblity: Joi.string().allow("").optional(),
      attachments: Joi.array().allow("").items(Joi.string()).optional(),
    }),
  }),
  protect,
  editPost
);

router.get("/topTags", protect, topTags);

router.get("/searchTags", protect,searchTags);

router.delete("/deletePost/:postId", protect, deletePost);

router.use(errors());

module.exports = router;
