import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Profile from "../models/profile.model.js";
import Payment from "../models/payment.model.js";
import Visit from "../models/visit.model.js";
import Chat from "../models/chat.model.js";
import FriendRequest from "../models/friendRequest.model.js";

export const adminLogin = (req, res) => {
  console.log("Admin login route hit");
  const { email, password } = req.body;
  console.log("Admin Email:", process.env.ADMIN_EMAIL);
  console.log("Admin Password:", process.env.ADMIN_PASSWORD);
  console.log("Request Email:", email);
  console.log("Request Password:", password);

  if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = jwt.sign({ admin: true }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    return res.json({ success: true, token });
  }
  return res
    .status(401)
    .json({ success: false, message: "Invalid credentials" });
};

export const adminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token" });
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.admin) throw new Error("Not admin");
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProfiles = await Profile.countDocuments();
    const totalPayments = await Payment.countDocuments();
    let totalVisits = 0;
    try {
      totalVisits = await Visit.countDocuments();
    } catch {}
    res.json({ totalUsers, totalProfiles, totalPayments, totalVisits });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const getAllUsersWithPlans = async (req, res) => {
  try {
    const users = await User.find({}).select("name email").lean();
    const userIds = users.map((u) => u._id.toString());

    const profiles = await Profile.find({ userId: { $in: userIds } }).lean();
    const payments = await Payment.find({ userId: { $in: userIds } }).lean();

    const usersWithDetails = users.map((user) => {
      const profile = profiles.find(
        (p) => String(p.userId) === String(user._id)
      );
      const payment = payments.find(
        (p) => String(p.userId) === String(user._id)
      );
      return {
        ...user,
        profile,
        payment:
          payment !== null
            ? {
                planName: payment.planName,
                amount: payment.amountPaid,
                startDate: payment.startDate,
                expiryDate: payment.endDate,
                planStatus: payment.paymentStatus,
              }
            : null,
      };
    });

    res.json({ users: usersWithDetails });
  } catch (err) {
    console.error("Get all users error:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch users", error: err.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    
    const user = await User.findByIdAndDelete(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
     
    await Chat.deleteMany({
      $or: [{ from: userId }, { to: userId }]
    });

    
    await FriendRequest.deleteMany({ 
      $or: [{ from: userId }, { to: userId }]
    });

    res.json({ message: "User and related data deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
