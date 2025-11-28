import FriendRequest from "../models/friendRequest.model.js";
import User from "../models/user.model.js";
import Profile from "../models/profile.model.js";
import Subscription from "../models/Payment.model.js";

const sendFriendRequest = async (req, res) => {
  try {
    const senderId = req.userId;
    const { receiverId, message } = req.body;

    if (!receiverId) {
      return res.status(400).json({
        message: "Receiver ID is required",
        success: false,
      });
    }

    if (senderId === receiverId) {
      return res.status(400).json({
        message: "Cannot send friend request to yourself",
        success: false,
      });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    const existingRequest = await FriendRequest.findOne({
      sender: senderId,
      receiver: receiverId,
    });

    if (existingRequest) {
      if (existingRequest.status === "pending") {
        return res.status(400).json({
          message: "Friend request already sent",
          success: false,
        });
      } else if (existingRequest.status === "accepted") {
        return res.status(400).json({
          message: "Already friends",
          success: false,
        });
      } else if (existingRequest.status === "rejected") {
        existingRequest.status = "pending";
        existingRequest.message = message || "";
        await existingRequest.save();

        return res.status(200).json({
          message: "Friend request sent successfully",
          success: true,
          friendRequest: existingRequest,
        });
      }
    }

    const reverseRequest = await FriendRequest.findOne({
      sender: receiverId,
      receiver: senderId,
    });

    if (reverseRequest && reverseRequest.status === "pending") {
      return res.status(400).json({
        message: "This user has already sent you a friend request",
        success: false,
      });
    }

    const subscription = await Subscription.findOne({ userId: senderId });
    if (subscription?.planName === "Basic") {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const todayCount = await FriendRequest.countDocuments({
        sender: senderId,
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      });

      if (todayCount >= 2) {
        return res.status(403).json({
          success: false,
          message: "Basic plan users can send only 2 friend requests per day.",
        });
      }
    }

    const newRequest = new FriendRequest({
      sender: senderId,
      receiver: receiverId,
      message: message || "",
      status: "pending",
    });

    await newRequest.save();
    await newRequest.populate("sender", "name email");

    res.status(201).json({
      message: "Friend request sent successfully",
      success: true,
      friendRequest: newRequest,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to send friend request",
      error: error.message,
      success: false,
    });
  }
};

const getReceivedRequests = async (req, res) => {
  try {
    const userId = req.userId;

    const requests = await FriendRequest.find({
      receiver: userId,
      status: "pending",
    })
      .populate("sender", "name email")
      .sort({ createdAt: -1 });

    const requestsWithProfiles = await Promise.all(
      requests.map(async (request) => {
        const senderProfile = await Profile.findOne({
          userId: request.sender._id,
        });

        return {
          _id: request._id,
          sender: request.sender,
          senderProfile: senderProfile || null,
          message: request.message,
          status: request.status,
          createdAt: request.createdAt,
        };
      })
    );

    res.status(200).json({
      message: "Received requests fetched successfully",
      success: true,
      requests: requestsWithProfiles,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch received requests",
      error: error.message,
      success: false,
    });
  }
};

const getSentRequests = async (req, res) => {
  try {
    const userId = req.userId;

    const requests = await FriendRequest.find({
      sender: userId,
    })
      .populate("receiver", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Sent requests fetched successfully",
      success: true,
      requests,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch sent requests",
      error: error.message,
      success: false,
    });
  }
};

const acceptFriendRequest = async (req, res) => {
  try {
    const userId = req.userId;
    const { requestId } = req.params;

    const request = await FriendRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({
        message: "Friend request not found",
        success: false,
      });
    }

    if (request.receiver.toString() !== userId) {
      return res.status(403).json({
        message: "Unauthorized to accept this request",
        success: false,
      });
    }

    if (request.status === "accepted") {
      return res.status(400).json({
        message: "Friend request already accepted",
        success: false,
      });
    }

    request.status = "accepted";
    await request.save();

    const updatedSender = await User.findByIdAndUpdate(
      request.sender,
      {
        $addToSet: { friends: request.receiver },
      },
      {
        new: true,
        upsert: false,
      }
    );

    const updatedReceiver = await User.findByIdAndUpdate(
      request.receiver,
      {
        $addToSet: { friends: request.sender },
      },
      {
        new: true,
        upsert: false,
      }
    );

    res.status(200).json({
      message: "Friend request accepted",
      success: true,
      request,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to accept friend request",
      error: error.message,
      success: false,
    });
  }
};

const rejectFriendRequest = async (req, res) => {
  try {
    const userId = req.userId;
    const { requestId } = req.params;

    const request = await FriendRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({
        message: "Friend request not found",
        success: false,
      });
    }

    if (request.receiver.toString() !== userId) {
      return res.status(403).json({
        message: "Unauthorized to reject this request",
        success: false,
      });
    }

    request.status = "rejected";
    await request.save();

    res.status(200).json({
      message: "Friend request rejected",
      success: true,
      friendRequest: request,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to reject friend request",
      error: error.message,
      success: false,
    });
  }
};

const cancelFriendRequest = async (req, res) => {
  try {
    const userId = req.userId;
    const { requestId } = req.params;

    const request = await FriendRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({
        message: "Friend request not found",
        success: false,
      });
    }

    if (request.sender.toString() !== userId) {
      return res.status(403).json({
        message: "Unauthorized to cancel this request",
        success: false,
      });
    }

    await FriendRequest.findByIdAndDelete(requestId);

    res.status(200).json({
      message: "Friend request cancelled",
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to cancel friend request",
      error: error.message,
      success: false,
    });
  }
};

const getFriends = async (req, res) => {
  try {
    const userId = req.userId;

    const requests = await FriendRequest.find({
      $or: [{ sender: userId }, { receiver: userId }],
      status: "accepted",
    })
      .populate("sender", "name email")
      .populate("receiver", "name email")
      .sort({ updatedAt: -1 });

    const friends = await Promise.all(
      requests.map(async (request) => {
        const friendId =
          request.sender._id.toString() === userId
            ? request.receiver._id
            : request.sender._id;

        const friendProfile = await Profile.findOne({ userId: friendId });

        return {
          _id: friendId,
          name:
            request.sender._id.toString() === userId
              ? request.receiver.name
              : request.sender.name,
          email:
            request.sender._id.toString() === userId
              ? request.receiver.email
              : request.sender.email,
          profile: friendProfile || null,
          friendsSince: request.updatedAt,
        };
      })
    );

    res.status(200).json({
      message: "Friends fetched successfully",
      success: true,
      friends,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch friends",
      error: error.message,
      success: false,
    });
  }
};

const checkFriendshipStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const { targetUserId } = req.params;

    const request = await FriendRequest.findOne({
      $or: [
        { sender: userId, receiver: targetUserId },
        { sender: targetUserId, receiver: userId },
      ],
    });

    if (!request) {
      return res.status(200).json({
        message: "No friendship status",
        success: true,
        status: "none",
        isFriend: false,
      });
    }

    res.status(200).json({
      message: "Friendship status checked",
      success: true,
      status: request.status,
      isFriend: request.status === "accepted",
      requestId: request._id,
      isSender: request.sender.toString() === userId,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to check friendship status",
      error: error.message,
      success: false,
    });
  }
};

const removeFriend = async (req, res) => {
  try {
    const userId = req.userId;
    const { friendId } = req.body;

    await User.findByIdAndUpdate(userId, { $pull: { friends: friendId } });
    await User.findByIdAndUpdate(friendId, { $pull: { friends: userId } });

    await FriendRequest.deleteMany({
      $or: [
        { sender: userId, receiver: friendId, status: "accepted" },
        { sender: friendId, receiver: userId, status: "accepted" },
      ],
    });

    res.json({ success: true, message: "Friend removed successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to remove friend" });
  }
};

const getTodaySentRequestCount = async (req, res) => {
  try {
    const senderId = req.userId;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const count = await FriendRequest.countDocuments({
      sender: senderId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch today's request count" });
  }
};

export {
  sendFriendRequest,
  getReceivedRequests,
  getSentRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  getFriends,
  checkFriendshipStatus,
  removeFriend,
  getTodaySentRequestCount,
};