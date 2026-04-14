import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        // Determine folder based on request URL
        let folderName = "others";
        if (req.originalUrl.includes("meal")) folderName = "meals";
        else if (req.originalUrl.includes("user")) folderName = "profile_pics";
        else if (req.originalUrl.includes("review")) folderName = "reviews";
        
        return {
            folder: folderName,
            allowed_formats: ["jpg", "jpeg", "png"],
            resource_type: "image",
        };
    },
});

export const upload = multer({ storage: storage });