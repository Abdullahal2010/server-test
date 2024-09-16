const mongoose = require("mongoose");
const userSchema = mongoose.Schema({
  email: {
    type: String,
    require: true,
    unique: true,
  },
  password: {
    type: String,
    require: true,
  },
  timeZones: {
    type: Array,
  },
  is12Hour: {
    type: Boolean,
  },
  dateFormat: {
    type: Boolean,
  },
  createdOn: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("user", userSchema);
module.exports = User;
