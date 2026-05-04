import Review from "../models/review.model.js";
import Meal from "../models/meal.model.js";
import User from "../models/user.model.js";
import Alert from "../models/alert.model.js";
import { v2 as cloudinary } from "cloudinary";

export const createReview = async (req, res) => {
    try {
        const { userId, sellerId, mealId, orderId, rating, comment } = req.body;
        const reviewPhoto = req.file ? req.file.path : null;

        const newReview = new Review({
            userId,
            sellerId,
            mealId,
            orderId,
            rating,
            comment,
            reviewPhoto
        });

        await newReview.save();

        // Update Meal Average Rating
        const mealReviews = await Review.find({ mealId });
        const mealAvgRating = mealReviews.reduce((acc, curr) => acc + curr.rating, 0) / mealReviews.length;
        await Meal.findByIdAndUpdate(mealId, { averageRating: mealAvgRating });

        // Update Seller Total Reviews and Average Rating
        const sellerReviews = await Review.find({ sellerId });
        const sellerAvgRating = sellerReviews.reduce((acc, curr) => acc + curr.rating, 0) / sellerReviews.length;
        await User.findByIdAndUpdate(sellerId, { 
            averageRating: sellerAvgRating,
            $inc: { totalReviews: 1 } 
        });

        // Create Alert for Seller
        const student = await User.findById(userId);
        const meal = await Meal.findById(mealId);
        
        await Alert.create({
            userId: sellerId, // Seller is the recipient
            title: "New Review Received",
            message: `${student.firstName} ${student.lastName} left a ${rating}-star review for your meal "${meal.mealName}".`,
            type: "review"
        });

        res.status(201).json({ message: "Review posted successfully!", review: newReview });
    } catch (error) {
        console.error("Error creating review:", error);
        res.status(500).json({ message: "Error posting review", error: error.message });
    }
};

export const getSellerReviews = async (req, res) => {
    try {
        const { sellerId } = req.params;
        const reviews = await Review.find({ sellerId })
            .populate("userId", "firstName lastName profileImage")
            .populate("mealId", "mealName image")
            .sort({ createdAt: -1 });
        
        res.status(200).json(reviews);
    } catch (error) {
        res.status(500).json({ message: "Error fetching reviews", error: error.message });
    }
};

export const getMealReviews = async (req, res) => {
    try {
        const { mealId } = req.params;
        const reviews = await Review.find({ mealId })
            .populate("userId", "firstName lastName profileImage")
            .sort({ createdAt: -1 });
        
        res.status(200).json(reviews);
    } catch (error) {
        res.status(500).json({ message: "Error fetching meal reviews", error: error.message });
    }
};

export const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        // Support auth middleware OR body fallback
        const userId = req.user?.id || req.body.userId;

        const review = await Review.findById(id);
        if (!review) return res.status(404).json({ message: "Review not found" });
        if (review.userId.toString() !== userId)
            return res.status(403).json({ message: "Not authorized to delete this review" });

        const { mealId, sellerId, reviewPhoto } = review;

        // Delete image from Cloudinary
        if (reviewPhoto) {
            try {
                // Extract public_id from Cloudinary URL (folder/filename without extension)
                const urlParts = reviewPhoto.split('/');
                const fileWithExt = urlParts[urlParts.length - 1];
                const folder = urlParts[urlParts.length - 2];
                const publicId = `${folder}/${fileWithExt.split('.')[0]}`;
                await cloudinary.uploader.destroy(publicId);
            } catch (cloudErr) {
                console.error("Cloudinary delete error (non-fatal):", cloudErr.message);
            }
        }

        await Review.findByIdAndDelete(id);

        // Recalculate meal average rating
        const mealReviews = await Review.find({ mealId });
        const mealAvgRating = mealReviews.length
            ? mealReviews.reduce((acc, curr) => acc + curr.rating, 0) / mealReviews.length
            : 0;
        await Meal.findByIdAndUpdate(mealId, { averageRating: mealAvgRating });

        // Recalculate seller average rating and total reviews
        const sellerReviews = await Review.find({ sellerId });
        const sellerAvgRating = sellerReviews.length
            ? sellerReviews.reduce((acc, curr) => acc + curr.rating, 0) / sellerReviews.length
            : 0;
        await User.findByIdAndUpdate(sellerId, {
            averageRating: sellerAvgRating,
            totalReviews: sellerReviews.length,
        });

        res.status(200).json({ message: "Review deleted successfully" });
    } catch (error) {
        console.error("Error deleting review:", error);
        res.status(500).json({ message: "Error deleting review", error: error.message });
    }
};
