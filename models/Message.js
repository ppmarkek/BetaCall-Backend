import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
    text: { type: String },
    files: [
      {
        url: String,
        filename: String,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
