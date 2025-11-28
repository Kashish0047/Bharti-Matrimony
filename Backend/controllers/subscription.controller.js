import Subscription from "../models/payment.model.js";
import User from "../models/user.model.js";

const createSubscription = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const existingSubscription = await Subscription.findOne({ userId });
    if (existingSubscription && existingSubscription.isActive()) {
      return res.status(400).json({
        message: "You already have an active subscription",
        subscription: existingSubscription,
      });
    }

    const {
      planName,
      planPrice,
      planDuration,
      paymentId,
      orderId,
      amountPaid,
      paymentMethod,
      planStatus,
    } = req.body;

    if (
      !planName ||
      !planPrice ||
      !planDuration ||
      !paymentId ||
      !orderId ||
      !amountPaid ||
      !paymentMethod ||
      !planStatus
    ) {
      return res.status(400).json({
        message: "Please provide all required fields",
      });
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + planDuration);

    const newSubscription = new Subscription({
      userId,
      planName,
      planPrice,
      planDuration,
      startDate,
      endDate,
      paymentId,
      orderId,
      amountPaid,
      paymentMethod,
      paymentStatus: "Success",
      planStatus: planStatus || "Active",
    });

    await newSubscription.save();

    res.status(201).json({
      message: "Subscription created successfully",
      subscription: newSubscription,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

const getMySubscription = async (req, res) => {
  try {
    const userId = req.userId;

    const subscription = await Subscription.findOne({ userId }).populate(
      "userId",
      "name email"
    );

    if (!subscription) {
      return res.status(404).json({
        message: "No subscription found. Please purchase a plan.",
      });
    }

    const isActive =
      subscription.planStatus === "Active" && new Date() < subscription.endDate;

    res.status(200).json({
      message: "Subscription fetched successfully",
      subscription,
      isActive,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

const cancelSubscription = async (req, res) => {
  try {
    const userId = req.userId;

    const subscription = await Subscription.findOne({ userId });

    if (!subscription) {
      return res.status(404).json({
        message: "No subscription found",
      });
    }

    if (subscription.status === "Cancelled") {
      return res.status(400).json({
        message: "Subscription is already cancelled",
      });
    }

    subscription.status = "Cancelled";
    await subscription.save();

    res.status(200).json({
      message: "Subscription cancelled successfully",
      subscription,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

const renewSubscription = async (req, res) => {
  try {
    const userId = req.userId;

    const {
      planName,
      planPrice,
      planDuration,
      paymentId,
      orderId,
      amountPaid,
      paymentMethod,
    } = req.body;

    if (
      !planName ||
      !planPrice ||
      !planDuration ||
      !paymentId ||
      !orderId ||
      !amountPaid
    ) {
      return res.status(400).json({
        message: "Please provide all required fields",
      });
    }

    const subscription = await Subscription.findOne({ userId });

    if (subscription) {
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + planDuration);

      subscription.planName = planName;
      subscription.planPrice = planPrice;
      subscription.planDuration = planDuration;
      subscription.status = "Active";
      subscription.startDate = startDate;
      subscription.endDate = endDate;
      subscription.paymentId = paymentId;
      subscription.orderId = orderId;
      subscription.amountPaid = amountPaid;
      subscription.paymentMethod = paymentMethod;
      subscription.paymentStatus = "Success";
      subscription.paymentDate = new Date();

      await subscription.save();

      res.status(200).json({
        message: "Subscription renewed successfully",
        subscription,
      });
    } else {
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + planDuration);

      const newSubscription = new Subscription({
        userId,
        planName,
        planPrice,
        planDuration,
        startDate,
        endDate,
        paymentId,
        orderId,
        amountPaid,
        paymentMethod,
        paymentStatus: "Success",
      });

      await newSubscription.save();

      res.status(201).json({
        message: "Subscription created successfully",
        subscription: newSubscription,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

const checkSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.userId;

    const subscription = await Subscription.findOne({ userId });

    if (!subscription) {
      return res.status(200).json({
        hasSubscription: false,
        isActive: false,
        message: "No subscription found",
      });
    }

    const isActive = subscription.isActive();

    res.status(200).json({
      hasSubscription: true,
      isActive,
      subscription: {
        planName: subscription.planName,
        status: subscription.status,
        endDate: subscription.endDate,
        features: subscription.features,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

const getUserSubscription = async (req, res) => {
  try {
    const { userId } = req.params;
    const subscription = await Subscription.findOne({ userId });

    res.json({
      success: true,
      subscription: subscription || { planName: "Basic" },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch user subscription",
    });
  }
};

const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.userId;

    const payments = await Subscription.find({ userId }).sort({
      paymentDate: -1,
    });

    if (!payments || payments.length === 0) {
      return res.status(200).json({
        message: "No payment history found",
        payments: [],
      });
    }

    res.status(200).json({
      message: "Payment history fetched successfully",
      payments,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

export {
  createSubscription,
  getMySubscription,
  cancelSubscription,
  renewSubscription,
  checkSubscriptionStatus,
  getUserSubscription,
  getPaymentHistory,
};