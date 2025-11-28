import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  sendMessage,
  getChatMessages,
  getAllChats,
  deleteMessage,
  getUserForChat,
  sendMediaMessage,
  editMessage 
} from "../controllers/chat.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();


const uploadsDir = path.join(process.cwd(), "uploads/chat");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/chat/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, 
    files: 5, 
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|pdf|mp3|wav|webm|ogg/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only images, videos, audio files, and PDFs are allowed."
        )
      );
    }
  },
});


router.post("/send", authMiddleware, sendMessage);
router.get("/chat/:friendId", authMiddleware, getChatMessages);
router.get("/all-chats", authMiddleware, getAllChats);
router.delete("/:messageId", authMiddleware, deleteMessage);
router.put("/:messageId", authMiddleware, editMessage); 
router.get("/user/:userId", authMiddleware, getUserForChat);


router.post(
  "/send-media",
  authMiddleware,
  upload.array("media", 5),
  sendMediaMessage
);

export default router;
