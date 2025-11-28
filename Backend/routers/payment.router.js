import { Router } from "express";
import {
  createOrder,
  verifyPayment,
  getPaymentHistory,
} from "../controllers/payment.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = Router();

router.post("/create-order", authMiddleware, createOrder);
router.post("/verify", authMiddleware, verifyPayment);
router.get("/history", authMiddleware, getPaymentHistory);

export default router;