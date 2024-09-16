require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const User = require("./models/user.model.js");
const jwt = require("jsonwebtoken");
const passport = require("passport");

const app = express();
require("./config/database.js");

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(passport.initialize());

require("./config/passport.js");

// home route
app.get("/", (req, res) => {
  res.send("<h1>Welcome to the server</h1>");
});

// register route
app.post("/register", async (req, res) => {
  try {
    const email = req.body.email;
    if (!email) return res.status(400).send("Please provide an email");

    const password = req.body.password;
    if (!password) return res.status(400).send("Please provide a password");

    const user = await User.findOne({ email: req.body.email });
    if (user) {
      return res.status(400).send("This email is used");
    }

    bcrypt.hash(req.body.password, saltRounds, async (err, hash) => {
      const newUser = new User({
        email: req.body.email,
        password: hash,
        timeZones: [],
        is12Hour: true,
        dateFormat: false,
      });

      await newUser
        .save()
        .then((user) => {
          const payload = {
            id: user._id,
            email: user.email,
          };

          const token = jwt.sign(payload, process.env.SECRET_KEY,{});

          res.send({
            success: true,
            message: "User is created succesfully",
            user: {
              id: user._id,
              email: user.email,
              timeZones: user.timeZones,
              is12Hour: user.is12Hour,
              dateFormat: user.dateFormat,
            },
            token: "Bearer " + token,
          });
        })
        .catch((err) => {
          res.send({
            success: false,
            message: "User is not created",
            error: err.message,
          });
        });
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// login route
app.post("/login", async (req, res) => {
  const email = req.body.email;
  if (!email) return res.status(400).send("Please provide an email");

  const password = req.body.password;
  if (!password) return res.status(400).send("Please provide a password");

  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(401).send({
      success: false,
      message: "User is not found",
    });
  }

  if (!bcrypt.compareSync(req.body.password, user.password)) {
    return res.status(401).send({
      success: false,
      message: "Incorrect Password",
    });
  }

  const payload = {
    id: user._id,
    email: user.email,
  };

  const token = jwt.sign(payload, process.env.SECRET_KEY, {});

  return res.status(200).send({
    success: true,
    message: "User is logged in succesfully",
    token: "Bearer " + token,
  });
});

// profile route
app.get(
  "/profile",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    return res.status(200).send({
      success: true,
      user: {
        id: req.user._id,
        email: req.user.email,
        timeZones: req.user.timeZones,
        is12Hour: req.user.is12Hour,
        dateFormat: req.user.dateFormat,
      },
    });
  }
);

app.post(
  "/addzones",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const id = req.user._id;

    const prevTimeZones = req.user.timeZones;

    if (prevTimeZones.includes(req.body.newTimeZone))
      return res.status(400).send("Time Zone already exists");

    const newTimeZones = [...prevTimeZones, req.body.newTimeZone];

    const updatedUser = await User.findOneAndUpdate(
      { _id: id },
      { $set: { timeZones: newTimeZones } },
      { new: true }
    );

    return res.status(200).send({
      success: true,
      message: "Time zone successfully added ",
      user: {
        _id: updatedUser._id,
        email: updatedUser.email,
        timeZones: updatedUser.timeZones,
        is12Hour: updatedUser.is12Hour,
        dateFormat: updatedUser.dateFormat,
      },
    });
  }
);

app.post(
  "/deleteZones",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const id = req.user._id;

    let prevTimeZones = req.user.timeZones;

    if (!prevTimeZones.includes(req.body.newTimeZone))
      return res.status(400).send("There is no shuch time zones !");

    const newTimeZones = prevTimeZones.filter(
      (zone) => zone !== req.body.newTimeZone
    );

    const updatedUser = await User.findOneAndUpdate(
      { _id: id },
      { $set: { timeZones: newTimeZones } },
      { new: true }
    );

    return res.status(200).send({
      success: true,
      message: "Time zone successfully Deleted ",
      user: {
        _id: updatedUser._id,
        email: updatedUser.email,
        timeZones: updatedUser.timeZones,
        is12Hour: updatedUser.is12Hour,
        dateFormat: updatedUser.dateFormat,
      },
    });
  }
);

app.post(
  "/toggle12hour",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const id = req.user._id;
    const value = req.body.is12Hour === true;
    const updatedUser = await User.findOneAndUpdate(
      { _id: id },
      { $set: { is12Hour: value } },
      { new: true }
    );

    return res.status(200).send({
      success: true,
      message: "Is12Hour format is succesfully updated",
      user: {
        _id: updatedUser._id,
        email: updatedUser.email,
        timeZones: updatedUser.timeZones,
        is12Hour: updatedUser.is12Hour,
        dateFormat: updatedUser.dateFormat,
      },
    });
  }
);

app.post(
  "/toggledateformat",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const id = req.user._id;
    const value = req.body.dateFormat === true;
    const updatedUser = await User.findOneAndUpdate(
      { _id: id },
      { $set: { dateFormat: value } },
      { new: true }
    );

    return res.status(200).send({
      success: true,
      message: "DateFormat is succesfully updated",
      user: {
        _id: updatedUser._id,
        email: updatedUser.email,
        timeZones: updatedUser.timeZones,
        is12Hour: updatedUser.is12Hour,
        dateFormat: updatedUser.dateFormat,
      },
    });
  }
);

// resource not found
app.use((req, res, next) => {
  res.status(404).json({
    message: "route not found",
  });
});

// server error
app.use((err, req, res, next) => {
  res.status(500).json({
    message: "Something broke",
  });
});

module.exports = app;
