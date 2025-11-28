import Razorpay from "razorpay";
import crypto from "crypto";
import Subscription from "../models/payment.model.js";
import User from "../models/user.model.js";

const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay keys not configured');
  }
  
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

const createOrder = async (req, res) => {
  try {
    const userId = req.userId;
    const { planName, planPrice, planDuration } = req.body;
    if (!planName || !planPrice || !planDuration) {
      return res
        .status(400)
        .json({ message: "Please provide all the details" });
    }

    const razorpay = getRazorpayInstance();

    const timestamp = Date.now().toString().slice(-8); 
    const receipt = `rcpt_${userId.toString().slice(-10)}_${timestamp}`; 


    const options = {
      amount: planPrice * 100, 
      currency: "INR",
      receipt: receipt,
      notes: {
        userId,
        planName,
        planDuration,
      },
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      message: "Order created successfully",
      order: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        planName,
        planDuration,
      },
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planName,
      planPrice,
      planDuration,
    } = req.body;

    console.log("📦 Payment data:", { 
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });
    
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    console.log("🔐 Signature check:", { 
      expected: expectedSignature,
      received: razorpay_signature,
      match: expectedSignature === razorpay_signature,
    });  

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      console.error("❌ Invalid signature!"); 
      return res.status(400).json({
        message: "Invalid payment signature",
        success: false,
      });
    }

    console.log("✅ Signature verified! Creating subscription..."); 


    const existingSubscription = await Subscription.findOne({ userId });

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + planDuration);

    if (existingSubscription) {
      
      existingSubscription.planName = planName;
      existingSubscription.planPrice = planPrice;
      existingSubscription.planDuration = planDuration;
      existingSubscription.planStatus = "Active";
      existingSubscription.startDate = startDate;
      existingSubscription.endDate = endDate;
      existingSubscription.paymentId = razorpay_payment_id;
      existingSubscription.orderId = razorpay_order_id;
      existingSubscription.amountPaid = planPrice;
      existingSubscription.paymentStatus = "Success";
      existingSubscription.paymentDate = new Date();
      existingSubscription.paymentMethod = "Razorpay";

      await existingSubscription.save();

      console.log("✅ Subscription updated!");

      return res.status(200).json({
        message: "Payment verified and subscription updated successfully",
        success: true,
        subscription: existingSubscription,
      });
    } else {
      
      const newSubscription = new Subscription({
        userId,
        planName,
        planPrice,
        planDuration,
        planStatus: "Active",
        startDate,
        endDate,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        amountPaid: planPrice,
        paymentStatus: "Success",
        paymentMethod: "Razorpay",
      });

      await newSubscription.save();

        console.log("✅ Subscription created!");

      return res.status(201).json({
        message: "Payment verified and subscription created successfully",
        success: true,
        subscription: newSubscription,
      });
    }
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({
      message: "Payment verification failed",
      error: error.message,
      success: false,
    });
  }
};

const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.userId;

    const subscriptions = await Subscription.find({ userId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      message: "Payment history fetched successfully",
      history: subscriptions,
    });
  } catch (error) {
    console.error("Get payment history error:", error);
    res.status(500).json({
      message: "Failed to fetch payment history",
      error: error.message,
    });
  }
};

export { createOrder, verifyPayment, getPaymentHistory };
