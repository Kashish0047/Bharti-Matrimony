import { Router } from "express";
import { registerUser, LoginUser, getUserById, getMe, changePassword, deleteAccount } from "../controllers/user.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", LoginUser);
router.get("/me", authMiddleware, getMe);
router.get("/:userId", getUserById);
router.post("/change-password", authMiddleware, changePassword);
router.delete("/delete-account", authMiddleware, deleteAccount);


export default router;

