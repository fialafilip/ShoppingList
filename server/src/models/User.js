// server/src/models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: String,
  googleId: String,
  picture: String,
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Family",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("User", userSchema);
