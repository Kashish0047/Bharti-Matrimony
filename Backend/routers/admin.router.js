import express from "express";
import {
  adminLogin,
  adminAuth,
  getAnalytics,
  getAllUsersWithPlans,
  deleteUser,
} from "../controllers/admin.controller.js";

const router = express.Router();

router.post("/login", adminLogin);
router.get("/analytics", adminAuth, getAnalytics);
router.get("/users", adminAuth, getAllUsersWithPlans); 
router.delete("/users/:userId", adminAuth, deleteUser);

export default router;
