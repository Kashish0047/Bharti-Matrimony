import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import {
  createProfile,
  getMyProfile,
  updateProfile,
  deleteProfile,
  getAllProfiles,
  getProfileById,
  uploadProfilePic,
  uploadAdditionalPhotos,
  deleteAdditionalPhoto,
} from "../controllers/profile.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/profiles/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 4, // Maximum 4 files (1 profile pic + 3 additional photos)
  },
});

// ✅ Multiple file upload middleware configurations
const uploadProfileFiles = upload.fields([
  { name: "profilePic", maxCount: 1 },
  { name: "additionalPhotos", maxCount: 3 },
]);

const uploadSingle = upload.single("profilePic");
const uploadAdditionalPhotosOnly = upload.array("additionalPhotos", 3);

// ✅ Routes with updated middleware
router.post(
  "/create",
  authMiddleware,
  uploadProfileFiles, // ✅ Now handles both profile pic and additional photos
  createProfile
);

router.get("/my-profile", authMiddleware, getMyProfile);

router.put(
  "/update",
  authMiddleware,
  uploadProfileFiles, 
  updateProfile
);

router.delete("/delete", authMiddleware, deleteProfile);

router.get("/all", authMiddleware, getAllProfiles);

router.get("/:profileId", authMiddleware, getProfileById);


router.post("/upload-pic", authMiddleware, uploadSingle, uploadProfilePic);


router.post(
  "/upload-additional",
  authMiddleware,
  uploadAdditionalPhotosOnly,
  uploadAdditionalPhotos
);


router.delete(
  "/delete-additional/:photoIndex",
  authMiddleware,
  deleteAdditionalPhoto
);

export default router;
