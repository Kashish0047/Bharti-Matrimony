import Message from "../models/chat.model.js";
import User from "../models/user.model.js";
import Profile from "../models/profile.model.js";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";

function containsRestrictedContent(text) {
  if (!text) return false;
  const patterns = [
    /\b\d{10,}\b/,
    /\b[\w.-]+@[\w.-]+\.\w{2,}\b/,
    /(https?:\/\/[^\s]+)/,
    /(www\.[^\s]+)/,
    /@[a-zA-Z0-9_]+/,
  ];
  return patterns.some((pat) => pat.test(text));
}

export const sendMessage = async (req, res) => {
  try {
    const senderId = req.userId;
    const { receiverId, content } = req.body;

    const user = await User.findById(senderId);
    if (user.plan === "basic") {
      const sentCount = await Message.countDocuments({
        sender: senderId,
        receiver: receiverId,
      });
      if (sentCount >= 5) {
        return res.status(403).json({
          success: false,
          message: "Basic plan users can only send 5 messages.",
        });
      }
      if (containsRestrictedContent(content)) {
        return res.status(400).json({
          success: false,
          message: "Contact details, links, and usernames are not allowed.",
        });
      }
    }

    if (!receiverId || !content) {
      return res.status(400).json({
        message: "Receiver and content are required",
        success: false,
      });
    }

    const chatId = [senderId, receiverId].sort().join("-");
    const message = new Message({
      chatId,
      sender: senderId,
      receiver: receiverId,
      content: content.trim(),
      messageType: "text",
    });

    const savedMessage = await message.save();
    await savedMessage.populate("sender", "name email");

    try {
      const io = req.app.get("io");
      if (io) {
        io.to(chatId).emit("receive-message", savedMessage);
        io.to(`user_${senderId}`).emit("receive-message", savedMessage);
        io.to(`user_${receiverId}`).emit("receive-message", savedMessage);
      }
    } catch (socketError) {
      console.error("❌ Socket emission failed:", socketError.message);
    }

    res.status(201).json({
      message: "Message sent successfully",
      success: true,
      data: savedMessage,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
      error: error.message,
      success: false,
    });
  }
};

const getChatMessages = async (req, res) => {
  try {
    const userId = req.userId;
    const { friendId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const friendObjectId = new mongoose.Types.ObjectId(friendId);

    const messages = await Message.find({
      $or: [
        { sender: userObjectId, receiver: friendObjectId },
        { sender: friendObjectId, receiver: userObjectId },
      ],
    })
      .populate("sender", "name email")
      .populate("receiver", "name email")
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((page - 1) * limit);

    const total = await Message.countDocuments({
      $or: [
        { sender: userObjectId, receiver: friendObjectId },
        { sender: friendObjectId, receiver: userObjectId },
      ],
    });

    await Message.updateMany(
      {
        $or: [
          { sender: userObjectId, receiver: friendObjectId },
          { sender: friendObjectId, receiver: userObjectId },
        ],
        receiver: userObjectId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    res.status(200).json({
      message: "Messages fetched successfully",
      success: true,
      messages: messages.reverse(),
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
      error: error.message,
      success: false,
    });
  }
};

const getAllChats = async (req, res) => {
  try {
    const userId = req.userId;

    const chats = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: new mongoose.Types.ObjectId(userId) },
            { receiver: new mongoose.Types.ObjectId(userId) },
          ],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ["$sender", new mongoose.Types.ObjectId(userId)] },
              then: "$receiver",
              else: "$sender",
            },
          },
          lastMessage: { $first: "$$ROOT" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "otherUser",
        },
      },
      {
        $lookup: {
          from: "profiles",
          localField: "_id",
          foreignField: "userId",
          as: "otherProfile",
        },
      },
      {
        $addFields: {
          "lastMessage.otherUser": {
            $mergeObjects: [
              { $arrayElemAt: ["$otherUser", 0] },
              { $arrayElemAt: ["$otherProfile", 0] },
            ],
          },
        },
      },
      {
        $project: {
          otherUser: 0,
          otherProfile: 0,
        },
      },
    ]);

    res.status(200).json({
      message: "Chats fetched successfully",
      success: true,
      chats,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
      error: error.message,
      success: false,
    });
  }
};

export const getUserForChat = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const profile = await Profile.findOne({ userId }).populate(
      "userId",
      "name email"
    );

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
      profile: profile || null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user data",
    });
  }
};

export const sendMediaMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.userId;

    const user = await User.findById(senderId);
    if (user.plan === "basic") {
      return res.status(403).json({
        success: false,
        message: "Basic plan users cannot send media messages.",
      });
    }

    if (!senderId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      });
    }

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: "Receiver ID is required",
      });
    }

    const chatId = [senderId, receiverId].sort().join("-");
    const mediaFiles = req.files.map((file) => ({
      url: `/uploads/chat/${file.filename}`,
      originalName: file.originalname,
      fileType: file.mimetype,
      size: file.size,
    }));

    const messageData = {
      chatId: chatId,
      sender: senderId,
      receiver: receiverId,
      content: content || "",
      messageType: "media",
      mediaFiles: mediaFiles,
    };

    const message = new Message(messageData);
    const savedMessage = await message.save();
    await savedMessage.populate("sender", "name email");

    try {
      const io = req.app.get("io");
      if (io) {
        io.to(chatId).emit("receive-message", savedMessage);
        io.to(`user_${senderId}`).emit("receive-message", savedMessage);
        io.to(`user_${receiverId}`).emit("receive-message", savedMessage);
      }
    } catch (socketError) {
      console.error("❌ Socket emission failed:", socketError.message);
    }

    res.json({
      success: true,
      message: savedMessage,
      mediaFiles: mediaFiles,
    });
  } catch (error) {
    if (req.files) {
      req.files.forEach((file) => {
        const filePath = path.join(
          process.cwd(),
          "uploads/chat/",
          file.filename
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || "Failed to send media message",
    });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.userId;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Content is required",
      });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    if (message.sender.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own messages",
      });
    }

    if (message.messageType !== "text") {
      return res.status(400).json({
        success: false,
        message: "Only text messages can be edited",
      });
    }

    message.content = content.trim();
    message.isEdited = true;
    message.editedAt = new Date();

    const updatedMessage = await message.save();
    await updatedMessage.populate("sender", "name email");

    try {
      const io = req.app.get("io");
      if (io) {
        io.to(message.chatId).emit("message-edited", updatedMessage);
        io.to(`user_${message.sender}`).emit("message-edited", updatedMessage);
        io.to(`user_${message.receiver}`).emit(
          "message-edited",
          updatedMessage
        );
      }
    } catch (socketError) {
      console.error("❌ Socket emission failed:", socketError.message);
    }

    res.json({
      success: true,
      message: "Message updated successfully",
      data: updatedMessage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to edit message",
    });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    if (message.sender.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own messages",
      });
    }

    if (
      message.messageType === "media" &&
      message.mediaFiles &&
      message.mediaFiles.length > 0
    ) {
      message.mediaFiles.forEach((media) => {
        const filePath = path.join(
          process.cwd(),
          "uploads/chat/",
          path.basename(media.url)
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    await Message.findByIdAndDelete(messageId);

    try {
      const io = req.app.get("io");
      if (io) {
        io.to(message.chatId).emit("message-deleted", { messageId });
        io.to(`user_${message.sender}`).emit("message-deleted", { messageId });
        io.to(`user_${message.receiver}`).emit("message-deleted", {
          messageId,
        });
      }
    } catch (socketError) {
      console.error("❌ Socket emission failed:", socketError.message);
    }

    res.json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete message",
    });
  }
};

export { getChatMessages, getAllChats };