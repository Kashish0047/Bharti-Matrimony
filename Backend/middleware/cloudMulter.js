import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";


const cloudStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        return {
            folder: "bharti_matrimony/profiles",
            allowed_formats: ["jpg", "png", "jpeg", "webp"],
            public_id: `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
            transformation: [
                { width: 1000, height: 1000, crop: "limit", quality: "auto" }
            ]
        };
    }
});


const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed!"), false);
    }
};


export const upload = multer({ 
    storage: cloudStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per file
    }
});