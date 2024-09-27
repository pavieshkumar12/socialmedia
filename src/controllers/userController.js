const User = require("../models/userModel");
const { addToBlacklist, isTokenBlacklisted } = require("../token/tokenHandler");
const bcrypt = require("bcryptjs");
const { createToken, verifyToken } = require("../token/jwt");
const { COOKIE_OPTIONS } = require("../utils/cookie");
const { sendMail } = require("../utils/mailer");
const twilio = require("twilio");
require("dotenv").config();
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Function to generate random OTP number
const generateRandomNumber = () => {
  return Math.floor(10000 + Math.random() * 90000); // Generates a random 5-digit number
};

// Function to generate random name suggestions
function generateRandomSuggestions(baseName) {
  const suggestions = [];
  for (let i = 1; i <= 5; i++) {
    const randomSuffix = Math.floor(Math.random() * 100);
    suggestions.push(`${baseName}${randomSuffix}`);
  }
  return suggestions;
}

const signup = async (req, res, next) => {
  try {
    const { email,yourName, phoneNumber, password } = req.body;

    // Check if the email already exists in the User model
    if (email) {
      const existingEmailUser = await User.findOne({ email });

      if (existingEmailUser) {
        if (existingEmailUser.isVerified) {
          return res.status(400).json({
            message: "Email already exists and is verified",
          });
        } else {
          // Hash the password before updating the existing user record
          const hashedPassword = await bcrypt.hash(password, 10);
          const newOtpCode = generateRandomNumber();
          const emailMsgOne = {
            to: email,
            from: "paviesh@throughbit.com",
            subject: "Your Email Verify Code",
            html: `<strong>Your Password Verify Code ${newOtpCode} </strong>`,
          };

          const isMailSentOne = await sendMail(emailMsgOne);

          if (!isMailSentOne) {
            return res.status(400).json({
              message: `Error occurred while sending the email Code for ${email}`,
            });
          }
          // Update the existing user record and set isVerified to true
          await User.updateOne(
            { email, isVerified: false },
            {
              $set: {
                email,
                otpCode: newOtpCode,
                password: hashedPassword,
                yourName: yourName,
              },
            }
          );

          // Include user details in the response
          const userResponses = {
            id: existingEmailUser._id,
            phoneNumber: null,
            email: existingEmailUser.email,
            yourName: yourName,
            token: await createToken({ id: existingEmailUser._id }),
          };

          return res.status(200).json({
            message: "User registered successfully",
            user: userResponses,
          });
        }
      }
    }

    if (phoneNumber) {
      const existingphoneNumberUser = await User.findOne({ phoneNumber });

      if (existingphoneNumberUser) {
        if (existingphoneNumberUser.isVerified) {
          return res.status(400).json({
            message: "PhoneNumber already exists and is verified",
          });
        } else {
          // Hash the password before updating the existing user record
          const hashedPassword = await bcrypt.hash(password, 10);
          const newOtpCode = generateRandomNumber();
          await twilioClient.messages.create({
            body: `Your OTP code is: ${newOtpCode}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phoneNumber,
          });
          await User.updateOne(
            { phoneNumber, isVerified: false },
            {
              $set: {
                phoneNumber,
                otpCode: newOtpCode,
                password: hashedPassword,
                yourName: yourName
              },
            }
          );
          // Include user details in the response
          const userResponses = {
            id: existingphoneNumberUser._id,
            email: null,
            phoneNumber: existingphoneNumberUser.phoneNumber,
            yourName: yourName,
            token: await createToken({ id: existingphoneNumberUser._id }),
          };

          return res.status(200).json({
            message: "User registered successfully",
            user: userResponses,
          });
        }
      }
    }

    // Generate a random 5-digit number
    const verificationCode = generateRandomNumber();

    // Hash the password before saving to the database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save the user to the database
    const user = await User.create({
      email: email,
      phoneNumber: phoneNumber,
      password: hashedPassword,
      otpCode: verificationCode,
      yourName: yourName,
    });

    // Create a token
    const token = await createToken({ id: user._id });

    // Set the userId and token in cookies
    res.cookie("id", user._id.toString(), COOKIE_OPTIONS);
    res.cookie("token", token, COOKIE_OPTIONS);

    // Send email verification code if email is provided
    if (email) {
      const emailMsg = {
        to: email,
        from: "paviesh@throughbit.com",
        subject: "Your Email Verify Code",
        html: `<strong>Your Password Verify Code ${verificationCode} </strong>`,
      };

      const isMailSent = await sendMail(emailMsg);
      if (!isMailSent) {
        return res.status(400).json({
          message: `Error occurred while sending the email Code for ${email}`,
        });
      }
    }

    if (phoneNumber) {
      await twilioClient.messages.create({
        body: `Your OTP code is: ${verificationCode}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber,
      });
    }
    // Include user details in the response
    const userResponse = {
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      yourName: user.yourName,
      token: token,
    };

    res.status(200).json({
      message: "User registered successfully",
      user: userResponse,
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, phoneNumber, password } = req.body;

    if (!((email && !phoneNumber) || (!email && phoneNumber)) || !password) {
      return res.status(401).send({ message: "Invalid login details" });
    }

    let user;

    if (email) {
      user = await User.findOne({ email: email });
    } else {
      user = await User.findOne({ phoneNumber: phoneNumber });
    }

    if (!user) {
      return res.status(400).send({ message: "User not found" });
    }

    const isPasswordIsValid = await bcrypt.compare(password, user.password);

    if (!isPasswordIsValid) {
      return res
        .status(400)
        .send({ message: "Incorrect Username and Password" });
    }

    const token = await createToken({ id: user._id });
    // req.session.user = user;

    // Set the userId in a cookie
    res.cookie("id", user._id.toString(), COOKIE_OPTIONS);
    res.cookie("token", token.toString(), COOKIE_OPTIONS);

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        token: token,
      },
    });
  } catch (err) {
    next(err);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const { email, yourName, provider, isVerified } = req.body;
    const existingUser = await User.findOne({ email: email });
    // Create a token
    let token = await createToken({
      id: existingUser ? existingUser._id : null,
    });
    if (existingUser) {
      // User with the provided email already exists
      return res.status(200).json({
        message: "User login with google",
        user: {
          id: existingUser._id,
          email: existingUser.email,
          yourName: existingUser.yourName,
          token: token,
        },
      });
    }
    // Create a new user without the password field
    const newUser = await User.create({
      email: email,
      yourName: yourName,
      provider: provider,
      isVerified: isVerified,
    });
    // Create a token for the new user
    token = await createToken({ id: newUser._id });
    // Set the userId and token in cookies
    res.cookie("id", newUser._id.toString(), COOKIE_OPTIONS);
    res.cookie("token", token.toString(), COOKIE_OPTIONS);
    return res.status(200).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        email: newUser.email,
        yourName: newUser.yourName,
        token: token,
      },
    });
  } catch (err) {
    next(err);
  }
};

const resendPwdOtp = async (req, res, next) => {
  try {
    const email = req.body.email;
    const phoneNumber = req.body.phoneNumber;

    // Check if either email or phoneNumber is provided
    if (!email && !phoneNumber) {
      return res.status(400).send({
        message: "Either email or phoneNumber must be provided",
      });
    }

    let user;
    if (email) {
      user = await User.findOne({ email: email });
    } else {
      user = await User.findOne({ phoneNumber: phoneNumber });
    }

    if (!user) {
      return res.status(404).send({
        message: `User not found`,
      });
    }
    // Generate a random 5-digit number
    const verificationCode = generateRandomNumber();

    // Update the passwordCode or phoneNumberCode in the user document
    if (email || phoneNumber) {
      user.passwordCode = verificationCode;
    }

    await user.save();

    // Prepare email message if email is provided
    if (email) {
      const emailMsg = {
        to: email,
        from: "paviesh@throughbit.com",
        subject: "Your Resend password OTP Code",
        html: `<strong>Your Password Verify Code ${verificationCode}</strong>`,
      };

      // Send email with the OTP code
      const isMail = await sendMail(emailMsg);
      if (!isMail) {
        return res.status(400).send({
          message: `Error occurred while sending the email code`,
        });
      }
    }

    // Prepare SMS message if phoneNumber is provided
    if (phoneNumber) {
      await twilioClient.messages.create({
        to: phoneNumber,
        body: `Your Resend password OTP code is: ${verificationCode}`,
        from: process.env.TWILIO_PHONE_NUMBER,
      });
    }

    return res.status(200).send({
      message: "Password code sent successfully",
    });
  } catch (err) {
    next(err);
  }
};

const resendOtp = async (req, res, next) => {
  try {
    const email = req.body.email;
    const phoneNumber = req.body.phoneNumber;

    // Check if either email or phoneNumber is provided
    if (!email && !phoneNumber) {
      return res.status(400).send({
        message: "Either email or phoneNumber must be provided",
      });
    }

    // Find user based on provided email or phoneNumber
    let user;
    if (email) {
      user = await User.findOne({ email: email });
    } else {
      user = await User.findOne({ phoneNumber: phoneNumber });
    }

    if (!user) {
      return res.status(404).send({
        message: `User not found`,
      });
    }

    // Generate a random 5-digit number
    const verificationCode = generateRandomNumber();

    // Update the otpCode or phoneNumberCode in the user document
    if (email || phoneNumber) {
      user.otpCode = verificationCode;
    }

    await user.save();

    // Prepare email message if email is provided
    if (email) {
      const emailMsg = {
        to: email,
        from: "paviesh@throughbit.com",
        subject: "Your Resend OTP Code",
        html: `<strong>Your Password Verify Code ${verificationCode}</strong>`,
      };

      // Send email with the OTP code
      const isMail = await sendMail(emailMsg);
      if (!isMail) {
        return res.status(400).send({
          message: `Error occurred while sending the email code`,
        });
      }
    }

    // Prepare SMS message if phoneNumber is provided
    if (phoneNumber) {
      await twilioClient.messages.create({
        to: phoneNumber,
        body: `Your Resend OTP code is: ${verificationCode}`,
        from: process.env.TWILIO_PHONE_NUMBER,
      });
    }

    return res.status(200).send({
      message: "Verification code sent successfully",
    });
  } catch (err) {
    next(err);
  }
};

const otpcodeVerify = async (req, res, next) => {
  try {
    const { otpCode } = req.body;
    const userId = req.user._id; // Assuming userId is stored in _id property

    // Find the user by userId
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send({
        message: `User with ID ${userId} not found`,
      });
    }

    // Check if the provided otpCode matches the stored otpCode
    if (user.otpCode !== otpCode) {
      return res.status(401).send({
        message: "Invalid Email Verification Code",
      });
    }

    // Update isVerified field to true
    user.isVerified = true;
    // Reset otpCode to null after successful verification
    user.otpCode = null;
    await user.save();

    return res.status(200).send({
      message: "Your Email Verification Code Verified Successfully",
    });
  } catch (err) {
    next(err);
  }
};

const forgetPassword = async (req, res, next) => {
  try {
    const email = req.body.email;
    const phoneNumber = req.body.phoneNumber;

    // Check if either email or phoneNumber is provided
    if (!email && !phoneNumber) {
      return res.status(400).send({
        message: "Either email or phoneNumber must be provided",
      });
    }

    let user;
    if (email) {
      user = await User.findOne({ email: email });
    } else {
      user = await User.findOne({ phoneNumber: phoneNumber });
    }

    if (!user) {
      return res.status(404).send({
        message: `User not found`,
      });
    }

    // Generate a random 5-digit number
    const verificationCode = generateRandomNumber();

    // Update the passwordCode in the user document
    if (email || phoneNumber) {
      user.passwordCode = verificationCode;
    }
    await user.save();
    if (email) {
      const emailMsg = {
        to: email,
        from: "paviesh@throughbit.com",
        subject: "Password Verify Code",
        html: `<strong>Your Password Verify Code is ${verificationCode}</strong>`,
      };

      const isMail = await sendMail(emailMsg);
      if (!isMail) {
        return res.status(400).send({
          message: `Error occurred while sending the email Code for ${email}`,
        });
      }
    }
    // Prepare SMS message if phoneNumber is provided
    if (phoneNumber) {
      await twilioClient.messages.create({
        to: phoneNumber,
        body: `Your Password Verify Code is: ${verificationCode}`,
        from: process.env.TWILIO_PHONE_NUMBER,
      });
    }

    return res.status(200).send({
      message: "Password Verification code sent successfully",
    });
  } catch (err) {
    next(err);
  }
};

const pwdCodeVerify = async (req, res, next) => {
  try {
    const email = req.body.email;
    const phoneNumber = req.body.phoneNumber;
    const passwordCode = req.body.passwordCode;

    // Check if either email or phoneNumber is provided
    if (!email && !phoneNumber) {
      return res.status(400).send({
        message: "Either email or phoneNumber must be provided",
      });
    }

    // Find user based on provided email or phoneNumber
    let user;
    if (email) {
      user = await User.findOne({ email: email });
    } else {
      user = await User.findOne({ phoneNumber: phoneNumber });
    }

    if (!user) {
      return res.status(404).send({
        message: `User not found`,
      });
    }

    // Check if the provided passwordCode matches the stored passwordCode
    if (user.passwordCode !== passwordCode) {
      return res.status(401).send({
        message: "Invalid Password Verification Code",
      });
    }

    // Reset passwordCode to null after successful verification
    user.passwordCode = null;
    await user.save();

    return res.status(200).send({
      message: "Your Password Verification Code Verified Successfully",
    });
  } catch (err) {
    next(err);
  }
};

const changePwd = async (req, res, next) => {
  try {
    const email = req.body.email;
    const phoneNumber = req.body.phoneNumber;
    const { password, confirmPassword } = req.body;

    // Find user based on provided email or phoneNumber
    let user;
    if (email) {
      user = await User.findOne({ email: email });
    } else {
      user = await User.findOne({ phoneNumber: phoneNumber });
    }

    if (!user) {
      return res.status(404).send({
        message: `User not found`,
      });
    }
    // Check if password and confirmPassword match
    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ message: "Password and confirmPassword do not match" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password
    user.password = hashedPassword;

    // Save the updated user to the database
    await user.save();

    // Send a success response
    res.status(200).json({ message: "Your Password Updated Successfully" });
  } catch (err) {
    // Handle errors
    next(err);
  }
};

const getUser = async (req, res, next) => {
  try {
    const getUserId = req.user._id;
    const getUser = await User.findById(getUserId);
    if (!getUser) {
      return res.status(404).json({ message: "User is not found" });
    }
    res.status(200).json(getUser);
  } catch (err) {
    next(err);
  }
};

const signOut = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    // Check if the token is already blacklisted
    if (await isTokenBlacklisted(token)) {
      res.status(401).send({ message: "Token is already blacklisted" });
      return;
    }

    // Add the token to the blacklist
    await addToBlacklist(token);

    // Clear the session
    req.session.destroy((err) => {
      if (err) {
        next(err);
        return;
      }

      // Clear the cookies in the response
      res.clearCookie("id");
      res.clearCookie("token");
      res.clearCookie("connect.sid");

      res.status(201).send({ message: "User logged out successfully" });
    });
  } catch (err) {
    next(err);
  }
};

const protect = async (req, res, next) => {
  let token;
  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];

      // Check if the token is blacklisted
      if (await isTokenBlacklisted(token)) {
        return res
          .status(401)
          .send({ message: "Unauthorized - Token blacklisted" });
      }

      const decoded = await verifyToken(token); // Use verifyToken function from jwt

      // Check again after decoding if the token is blacklisted
      if (await isTokenBlacklisted(token)) {
        return res
          .status(401)
          .send({ message: "Unauthorized - Token blacklisted" });
      }

      req.user = await User.findById(decoded.id).select("-password");

      next();
    }
  } catch (error) {
    return res
      .status(401)
      .send({ message: "Unauthorized - Token verification failed" });
  }

  if (!token) {
    return res
      .status(401)
      .send({ message: "Unauthorized - No token provided" });
  }
};

const editUser = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const updateFields = req.body;

    // Check if any fields are provided for update
    if (Object.keys(updateFields).length === 0 && !req.file) {
      return res.status(400).send({ message: "No fields provided for update" });
    }

    // Check if name exists in updateFields and trim it
    const trimmedName = updateFields.userName
      ? updateFields.userName.trim()
      : undefined;

    if (trimmedName) {
      // Check if the name already exists in the User model
      const existingUser = await User.findOne({ userName: trimmedName });
      if (existingUser) {
        // If the name already exists and is verified, generate random suggestions
        const suggestedNames = generateRandomSuggestions(trimmedName);
        return res.status(400).json({
          message: "Username already exists",
          suggestedNames,
        });
      }
    }

    let image;

    // Check if req.file is present (uploaded image)
    if (req.file) {
      image = req.file.path; // Use the path from multer to store in the database
      // Add the image path to the updateFields
      updateFields.image = image;
    }

    // Update the user with the provided fields
    const updatedUser = await User.findByIdAndUpdate(userId, updateFields, {
      new: true,
      select:
        "-password -otpCode -passwordCode -followers -followings -savePost -provider -isVerified", // Exclude the password field from the returned document
    });

    if (!updatedUser) {
      return res.status(404).send({ message: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  signup,
  login,
  googleLogin,
  signOut,
  forgetPassword,
  resendOtp,
  resendPwdOtp,
  editUser,
  getUser,
  pwdCodeVerify,
  otpcodeVerify,
  changePwd,
  protect,
};
