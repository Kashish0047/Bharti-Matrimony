import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";


const cloudStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        return {
            folder: "bharti_matrimony/profiles",
            allowed_formats: ["jpg", "png", "jpeg"],
            public_id: `${file.fieldname}-${Date.now()}`,
            transformation: [
                { width: 1000, height: 1000, crop: "limit" }
            ]
        };
    }
});

export const upload = multer({ storage: cloudStorage })