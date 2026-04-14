import express from "express";
import { createReview, getSellerReviews, getMealReviews } from "../controllers/reviewController.js";
import { upload } from "../services/cloudinaryConfig.js";

const router = express.Router();

router.post("/post-review", upload.single("reviewPhoto"), createReview);
router.get("/seller/:sellerId", getSellerReviews);
router.get("/meal/:mealId", getMealReviews);

export default router;
