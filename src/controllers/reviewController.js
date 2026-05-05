import Review from "../models/review.model.js";
import Meal from "../models/meal.model.js";
import User from "../models/user.model.js";
import Alert from "../models/alert.model.js";

export const createReview = async (req, res) => {
    try {
        const { userId, sellerId, mealId, orderId, rating, comment } = req.body;
        const reviewPhoto = req.file ? req.file.path : null;

        if (!reviewPhoto) {
            return res.status(400).json({ message: "Photo of the meal is required for a review." });
        }

        console.log("Review data received:", { userId, sellerId, mealId, orderId, rating, comment });

        if (!userId || !sellerId) {
            return res.status(400).json({ message: "UserId and SellerId are required." });
        }

        const newReview = new Review({
            userId,
            sellerId,
            mealId: mealId || undefined,
            orderId: orderId || undefined,
            rating,
            comment,
            reviewPhoto
        });

        await newReview.save();
        console.log("New review saved:", newReview._id);

        // Update Meal Average Rating (only if mealId exists and is an actual Meal)
        if (mealId && mealId !== "undefined" && mealId !== "") {
            try {
                const mealExists = await Meal.exists({ _id: mealId });
                if (mealExists) {
                    const mealReviews = await Review.find({ mealId });
                    const mealAvgRating = mealReviews.length > 0 
                        ? mealReviews.reduce((acc, curr) => acc + curr.rating, 0) / mealReviews.length 
                        : 0;
                    await Meal.findByIdAndUpdate(mealId, { averageRating: mealAvgRating });
                    console.log("Meal rating updated for mealId:", mealId);
                } else {
                    console.log("mealId provided but no matching Meal found (could be a MealRequest). Skipping meal rating update.");
                }
            } catch (err) {
                console.log("Invalid mealId format, skipping rating update.");
            }
        }

        // Update Seller Total Reviews and Average Rating
        if (sellerId) {
            const sellerReviews = await Review.find({ sellerId });
            const sellerAvgRating = sellerReviews.length > 0 
                ? sellerReviews.reduce((acc, curr) => acc + curr.rating, 0) / sellerReviews.length 
                : 0;
            
            await User.findByIdAndUpdate(sellerId, { 
                averageRating: sellerAvgRating,
                $inc: { totalReviews: 1 } 
            });
            console.log("Seller rating updated for sellerId:", sellerId);
        }

        // Create Alert for Seller
        const student = userId ? await User.findById(userId) : null;
        let meal = null;
        if (mealId && mealId !== "undefined" && mealId !== "") {
            try {
                meal = await Meal.findById(mealId);
            } catch (err) {
                console.log("Could not find meal for alert, might be a custom request.");
            }
        }
        
        if (student) {
            const subject = meal ? `your meal "${meal.mealName}"` : "your service";
            await Alert.create({
                userId: sellerId, // Seller is the recipient
                title: "New Review Received",
                message: `${student.firstName} ${student.lastName} left a ${rating}-star review for ${subject}.`,
                type: "review"
            });
        }

        res.status(201).json({ success: true, message: "Review posted successfully!", review: newReview });
    } catch (error) {
        console.error("Error creating review:", error);
        res.status(500).json({ 
            success: false,
            message: "Error posting review", 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
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
export const updateReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;
        const updateData = { rating, comment };

        if (req.file) {
            updateData.reviewPhoto = req.file.path;
        }

        const review = await Review.findByIdAndUpdate(id, updateData, { new: true });
        if (!review) return res.status(404).json({ message: "Review not found" });

        // Re-calculate ratings
        const mealReviews = await Review.find({ mealId: review.mealId });
        const mealAvgRating = mealReviews.reduce((acc, curr) => acc + curr.rating, 0) / mealReviews.length;
        await Meal.findByIdAndUpdate(review.mealId, { averageRating: mealAvgRating });

        const sellerReviews = await Review.find({ sellerId: review.sellerId });
        const sellerAvgRating = sellerReviews.reduce((acc, curr) => acc + curr.rating, 0) / sellerReviews.length;
        await User.findByIdAndUpdate(review.sellerId, { averageRating: sellerAvgRating });

        res.status(200).json({ message: "Review updated successfully", review });
    } catch (error) {
        res.status(500).json({ message: "Error updating review", error: error.message });
    }
};

export const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        console.log("Backend: Request to delete review with ID:", id);
        const review = await Review.findByIdAndDelete(id);
        if (!review) {
            console.log("Backend: Review not found for ID:", id);
            return res.status(404).json({ message: "Review not found" });
        }

        // Re-calculate Meal ratings after deletion (if meal exists)
        if (review.mealId) {
            const mealExists = await Meal.exists({ _id: review.mealId });
            if (mealExists) {
                const mealReviews = await Review.find({ mealId: review.mealId });
                const mealAvgRating = mealReviews.length > 0 
                    ? mealReviews.reduce((acc, curr) => acc + curr.rating, 0) / mealReviews.length 
                    : 0;
                await Meal.findByIdAndUpdate(review.mealId, { averageRating: mealAvgRating });
            }
        }

        // Re-calculate Seller ratings after deletion
        if (review.sellerId) {
            const sellerReviews = await Review.find({ sellerId: review.sellerId });
            const sellerAvgRating = sellerReviews.length > 0 
                ? sellerReviews.reduce((acc, curr) => acc + curr.rating, 0) / sellerReviews.length 
                : 0;
            
            await User.findByIdAndUpdate(review.sellerId, { 
                averageRating: sellerAvgRating,
                $inc: { totalReviews: -1 }
            });
        }

        res.status(200).json({ success: true, message: "Review deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting review", error: error.message });
    }
};

export const getUserReviews = async (req, res) => {
    try {
        const userId = req.user.id;
        const reviews = await Review.find({ userId })
            .populate("sellerId", "businessName firstName lastName profileImage")
            .populate("mealId", "mealName image")
            .sort({ createdAt: -1 });
        
        res.status(200).json({ success: true, reviews });
    } catch (error) {
        res.status(500).json({ message: "Error fetching your reviews", error: error.message });
    }
};
