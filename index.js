const express = require("express");
const app = express();
const router = require("./src/routes/allRoutes");
const cors = require("cors");
const session = require("express-session");
const mongodbSession = require("connect-mongodb-session")(session);
const passport = require("passport");
const mongoose = require("mongoose");
const morgan = require('morgan');
const helmet = require('helmet');
const cookieParser = require('cookie-parser')
require('dotenv').config();

// MongoDB connection URL
const mongoUrl = process.env.DBURL;

// Enable CORS for cross-origin requests
app.use(cors());

// Middleware for JSON request parsing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


// Setup Express session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,  // Set to false to prevent saving uninitialized sessions
    store: new mongodbSession({
      uri: mongoUrl,
      collection: "sessions",
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // Session duration in milliseconds
    },
  })
);

app.use(cookieParser());


app.use(passport.initialize());
app.use(passport.session());
app.use(helmet());

// Middleware for request logging
app.use(morgan(':method :url :status'));

// Use your routes
app.use(router);

app.get('/', (req, res) => {
  res.send(' ***🔥🔥 CoinDiary is Running 🔥🔥*** ');
});

// Connect to MongoDB
mongoose.connect(mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log("*********🛡️🔍 🏖️  Successfully Connected to MongoDB 🏖️ 🔍🛡️ **********");
  })
  .catch((err) => {
    console.error("MongoDB Connection Failure", err);
  });


// Define the port to listen on
const port = process.env.PORT || 3000;

// Start the Express server
app.listen(port, () => {
  console.log(`🔥🔥🏖️  $$$$$$ Server is listening on port ${port} $$$$$$$ 🏖️ 🔥🔥`);
});
