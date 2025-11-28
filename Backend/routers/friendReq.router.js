import express from "express";
import {
  sendFriendRequest,
  getReceivedRequests,
  getSentRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  getFriends,
  checkFriendshipStatus,
  removeFriend,
  getTodaySentRequestCount
} from "../controllers/friendRequest.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();


router.post("/send", authMiddleware, sendFriendRequest);


router.get("/received", authMiddleware, getReceivedRequests);


router.get("/sent", authMiddleware, getSentRequests);


router.put("/accept/:requestId", authMiddleware, acceptFriendRequest);


router.put("/reject/:requestId", authMiddleware, rejectFriendRequest);


router.delete("/cancel/:requestId", authMiddleware, cancelFriendRequest);


router.get("/friends", authMiddleware, getFriends);


router.get("/status/:targetUserId", authMiddleware, checkFriendshipStatus);

router.post("/remove-friend", authMiddleware, removeFriend);

router.get("/today-count", authMiddleware, getTodaySentRequestCount);

export default router;