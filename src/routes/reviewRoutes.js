import express from "express";
import { createReview, getSellerReviews, getMealReviews, deleteReview } from "../controllers/reviewController.js";
import { upload } from "../services/cloudinaryConfig.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/post-review", upload.single("reviewPhoto"), createReview);
router.get("/seller/:sellerId", getSellerReviews);
router.get("/meal/:mealId", getMealReviews);
router.delete("/:id", authMiddleware, deleteReview);

export default router;

