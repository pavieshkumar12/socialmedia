const express = require("express");
const {
  login,
  signup,
  googleLogin,
  signOut,
  forgetPassword,
  otpcodeVerify,
  resendOtp,
  editUser,
  getUser,
  pwdCodeVerify,
  changePwd,
  protect,
  resendPwdOtp,
} = require("../controllers/userController");
const { celebrate, Joi, errors, Segments } = require("celebrate");
const { upload } = require("../utils/multer");

const router = express.Router();

router.post(
  "/login",
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      email: Joi.string().email().allow("").optional(),
      phoneNumber: Joi.string()
        .regex(/^\+\d{1,3}\d{8,}$/)
        .allow("")
        .optional(),
      password: Joi.string().required(),
    }),
  }),
  login
);

router.post(
  "/googleLogin",
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      email: Joi.string().email().required(),
      yourName: Joi.string().required(),
      provider: Joi.string().required(),
      isVerified: Joi.boolean().required(),
    }),
  }),
  googleLogin
);

router.post(
  "/signup",
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      email: Joi.string().email().allow("").optional(),
      phoneNumber: Joi.string()
        .regex(/^\+\d{1,3}\d{8,}$/)
        .allow("")
        .optional(),
      password: Joi.string().required(),
      yourName: Joi.string().required(),
    }),
  }),
  signup
);

router.post(
  "/otpcodeVerify",
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      otpCode: Joi.number().required(),
    }),
  }),
  protect,
  otpcodeVerify
);

router.post(
  "/resendOtp",
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      email: Joi.string().email().allow("").optional(),
      phoneNumber: Joi.string()
        .regex(/^\+\d{1,3}\d{8,}$/)
        .allow("")
        .optional(),
    }),
  }),
  resendOtp
);

router.post(
  "/resendPwdOtp",
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      email: Joi.string().email().allow("").optional(),
      phoneNumber: Joi.string()
        .regex(/^\+\d{1,3}\d{8,}$/)
        .allow("")
        .optional(),
    }),
  }),
  resendPwdOtp
);

router.put(
  "/editUser",
  upload.single("image"),
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      image: Joi.string().allow("").optional(),
      // name: Joi.string().optional(),
      userName: Joi.string().optional(),
      gender: Joi.string().allow("").optional(),
      dob: Joi.string().allow("").optional(),
      cryptoInterest: Joi.string().allow("").optional(),
      marketLevel: Joi.string().allow("").optional(),
      tradeExperience: Joi.string().allow("").optional(),
      tradeVolume: Joi.string().allow("").optional(),
    }),
  }),
  protect,
  editUser
);

router.post(
  "/forgetPwd",
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      email: Joi.string().email().allow("").optional(),
      phoneNumber: Joi.string()
        .regex(/^\+\d{1,3}\d{8,}$/)
        .allow("")
        .optional(),
    }),
  }),
  forgetPassword
);

router.post(
  "/pwdCodeVerify",
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      email: Joi.string().email().allow("").optional(),
      phoneNumber: Joi.string()
        .regex(/^\+\d{1,3}\d{8,}$/)
        .allow("")
        .optional(),
      passwordCode: Joi.number().required(),
    }),
  }),
  pwdCodeVerify
);

router.post(
  "/changePwd",
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      email: Joi.string().email().allow("").optional(),
      phoneNumber: Joi.string()
        .regex(/^\+\d{1,3}\d{8,}$/)
        .allow("")
        .optional(),
      password: Joi.string().required(),
      confirmPassword: Joi.string().required(),
    }),
  }),
  changePwd
);

router.get("/getParticularUser", protect, getUser);

router.get("/signout", signOut);

router.use(errors());

module.exports = router;
