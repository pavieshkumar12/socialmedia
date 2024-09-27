const express = require("express");
const { celebrate, Joi, errors, Segments } = require("celebrate");
const { protect } = require("../controllers/userController");
const {
  getUserPostResponse,
  BullishPost,
  BearishPost,
  addComment,
  editComment,
  deleteComment,
  savedPost,
  replayComment,
  likeComment,
  dislikeComment,
  createCollection,
  editCollection,
  deleteCollection
} = require("../controllers/postResponseController");
const router = express.Router();
const { upload } = require("../utils/multer");

router.get(
  "/getUserPostResponse/:postId",
  celebrate({
    [Segments.PARAMS]: {
      postId: Joi.string().required(),
    },
  }),
  protect,
  getUserPostResponse
);

router.put(
  "/Bullish/:postId",
  celebrate({
    [Segments.PARAMS]: {
      postId: Joi.string().required(),
    },
  }),
  protect,
  BullishPost
);

router.put(
  "/Bearish/:postId",
  celebrate({
    [Segments.PARAMS]: {
      postId: Joi.string().required(),
    },
  }),
  protect,
  BearishPost
);

router.put(
  "/addComment/:postId",
  celebrate({
    [Segments.PARAMS]: {
      postId: Joi.string().required(),
    },
    [Segments.BODY]: {
      details: Joi.string().required(),
    },
  }),
  protect,
  addComment
);

router.put(
  "/likeComment/:commentId",
  celebrate({
    [Segments.PARAMS]: {
      commentId: Joi.string().required(),
    },
  }),
  protect,
  likeComment
);

router.put(
  "/dislikeComment/:commentId",
  celebrate({
    [Segments.PARAMS]: {
      commentId: Joi.string().required(),
    },
  }),
  protect,
  dislikeComment
);

router.put(
  "/editComment/:commentId",
  celebrate({
    [Segments.PARAMS]: {
      commentId: Joi.string().required(),
    },
    [Segments.BODY]: {
      details: Joi.string().required(),
    },
  }),
  protect,
  editComment
);

router.put(
  "/replayComment/:commentId",
  celebrate({
    [Segments.PARAMS]: {
      commentId: Joi.string().required(),
    },
    [Segments.BODY]: {
      replay: Joi.string().required(),
    },
  }),
  protect,
  replayComment
);

router.delete(
  "/deleteComment/:commentId",
  celebrate({
    [Segments.PARAMS]: {
      commentId: Joi.string().required(),
    },
  }),
  protect,
  deleteComment
);

router.put(
  "/savePost/:postId",
  celebrate({
    [Segments.PARAMS]: {
      postId: Joi.string().required(),
    },
    [Segments.BODY]: Joi.object().keys({
      collectionId: Joi.string().required(),
    }),
  }),
  protect,
  savedPost
);

router.post(
  "/createCollection",
  upload.any(),
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      savePost: Joi.array()
        .items(
          Joi.object().keys({
            collectionName: Joi.string().required(),
            collectionCover: Joi.string().optional(),
          })
        )
        .required(),
    }),
  }),
  protect,
  createCollection
);

router.put(
  "/editCollection/:collectionId",
  upload.any(),
  celebrate({
    [Segments.PARAMS]: {
      collectionId: Joi.string().required(),
    },
    [Segments.BODY]: Joi.object().keys({
      savePost: Joi.array().items(
        Joi.object().keys({
          collectionName: Joi.string().optional(),
          collectionCover: Joi.string().optional(),
        })
      ),
    }),
  }),
  protect,
  editCollection
);

router.delete(
  "/deleteCollection/:collectionId",
  celebrate({
    [Segments.PARAMS]: {
      collectionId: Joi.string().required(),
    },
  }),
  protect,
  deleteCollection
);

router.use(errors());

module.exports = router;
