import Message from "../models/Message.js";
import Group from "../models/Group.js";

export const sendPrivateMessage = async (req, res) => {
  try {
    const { recipientId, text } = req.body;
    const senderId = req.user._id;

    const files = req.files
      ? req.files.map((file) => ({
          url: `/uploads/${file.filename}`,
          filename: file.originalname,
        }))
      : [];

    const message = new Message({
      sender: senderId,
      recipient: recipientId,
      text,
      files,
    });

    await message.save();
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPrivateMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { recipientId } = req.params;
    const messages = await Message.find({
      $or: [
        { sender: userId, recipient: recipientId },
        { sender: recipientId, recipient: userId },
      ],
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createGroup = async (req, res) => {
  try {
    const { name, members } = req.body;
    const group = new Group({ name, members });
    await group.save();
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { groupId, text } = req.body;
    const senderId = req.user._id;

    const files = req.files
      ? req.files.map((file) => ({
          url: `/uploads/${file.filename}`,
          filename: file.originalname,
        }))
      : [];

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    if (!group.members.includes(senderId)) {
      return res
        .status(403)
        .json({ message: "You are not a member of this group." });
    }

    const message = new Message({
      sender: senderId,
      group: groupId,
      text,
      files,
    });

    await message.save();
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const messages = await Message.find({ group: groupId }).sort({
      createdAt: 1,
    });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
