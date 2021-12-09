const { model, Schema } = require("mongoose");
const schm = new Schema({
  username: {
    type: String,
    required: true,
  },
  won: {
    type: Number,
    default: 0,
  },
  highest: {
    type: Number,
    default: 0,
  },
});
const mod = model("User", schm, "lb");
module.exports = mod;
