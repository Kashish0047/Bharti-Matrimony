import { Router } from "express";
import {
  createSubscription,
  getMySubscription,
  cancelSubscription,
  renewSubscription,
  checkSubscriptionStatus,
  getUserSubscription,
  getPaymentHistory,
} from "../controllers/subscription.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";


const router = Router();


router.post("/create", authMiddleware, createSubscription);
router.get("/my-subscription", authMiddleware, getMySubscription);
router.put("/cancel", authMiddleware, cancelSubscription);
router.put("/renew", authMiddleware, renewSubscription);
router.get("/status", authMiddleware, checkSubscriptionStatus);
router.get('/user/:userId', authMiddleware, getUserSubscription);
router.get('/payment-history', authMiddleware, getPaymentHistory);

export default router;