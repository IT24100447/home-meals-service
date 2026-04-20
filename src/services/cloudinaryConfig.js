import CloudinaryStorage from "multer-storage-cloudinary";
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
        console.log(`Cloudinary Starting upload for file: ${file.originalname}`);

        // Determine folder based on request URL
        let folderName = "others";
        if (req.originalUrl.includes("meal-request")) folderName = "meal_requests";
        else if (req.originalUrl.includes("meal")) folderName = "meals";
        else if (req.originalUrl.includes("user")) folderName = "profile_pics";
        else if (req.originalUrl.includes("review")) folderName = "reviews";

        console.log(`Cloudinary Target folder: ${folderName}`);

        return {
            folder: folderName,
            allowed_formats: ["jpg", "jpeg", "png"],
            resource_type: "image",
        };
    },
});

export const upload = multer({ storage: storage });
