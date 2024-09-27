const express = require("express");
const { celebrate, Joi, errors, Segments } = require("celebrate");
const { protect } = require("../controllers/userController");
const {
  unfollowUser,
  userFollowingList,
  followUser,
  userFollowerList,
  getPopularUsers,
} = require("../controllers/userFollowController");
const router = express.Router();

router.put(
  "/followUser",
  celebrate({
    [Segments.BODY]: {
      userId: Joi.string().required(),
    },
  }),
  protect,
  followUser
);

router.put(
  "/unFollowUser",
  celebrate({
    [Segments.BODY]: {
      userId: Joi.string().required(),
    },
  }),
  protect,
  unfollowUser
);

router.get("/userFollowingList", protect, userFollowingList);

router.get("/userFollowerList", protect, userFollowerList);

router.get("/popularUsers", getPopularUsers);

router.use(errors());
module.exports = router;
