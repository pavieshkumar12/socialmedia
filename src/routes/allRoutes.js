const express = require("express");
const router = express.Router();

//all routes
router.use("/", require("./socialAuthRoute"));
router.use("/", require("./userRoute"));
router.use("/", require("./userPostRoute"));
router.use("/", require("./postResponseRoute"));
router.use("/", require("./userFollowRoute"));

module.exports = router;
