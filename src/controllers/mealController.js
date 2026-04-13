import mealService from "../services/mealService.js";
import Meal from "../models/meal.model.js";
import Review from "../models/review.model.js";
import User from "../models/user.model.js";

const createMeal = async (req, res) => {
    try {
        const sellerId = req.user.id;

        if (req.user.role !== 'seller') {
            return res.status(403).json({
                success: false,
                message: "Access Denied! Only sellers can create meals."
            });
        }

        const meal = await mealService.createMeal(req.body, req.file, sellerId);

        res.status(201).json({
            success: true,
            meal,
            message: "Meal created successfully"
        });
    } catch (err) {
        console.error("Error in createMeal controller: ", err);
        res.status(500).json({
            success: false,
            message: err.message || "Failed to create meal"
        });
    }
};

const getMyMeals = async (req, res) => {
    try {
        const sellerId = req.user.id;
        const meals = await Meal.find({ sellerId });
        res.status(200).json({
            success: true,
            meals
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getAllMeals = async (req, res) => {
    try {
        const { city } = req.query;
        let query = {};
        
        const meals = await Meal.find(query).populate({
            path: 'sellerId',
            select: 'firstName lastName businessName city profileImage',
            match: city ? { city: new RegExp(`^${city}$`, 'i') } : {}
        });

        // Filter out meals where the seller didn't match the city (if city was provided)
        const finalMeals = city ? meals.filter(meal => meal.sellerId !== null) : meals;

        res.status(200).json({
            success: true,
            meals: finalMeals
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const updateMeal = async (req, res) => {
    try {
        const meal = await mealService.updateMeal(req.params.id, req.body, req.file);
        res.status(200).json({
            success: true,
            message: "Meal Updated Successfully",
            meal
        });
    } catch (err) {
        console.error("Error Updating Meal: ", err);
        res.status(500).json({
            success: false,
            message: err.message || "Failed to update meal"
        });
    }
}

const removeMeal = async (req, res) => {
    try {
        const meal = await mealService.removeMeal(req.params.id);
        res.status(200).json({
            success: true,
            message: "Meal Deleted",
            meal
        })
    } catch (err) {
        console.log("Error Deleting Meal: ", err);
        res.status(500).json({
            success: false,
            message: err.message || "Failed to delete meal"
        })
    }
}

const getMealsBySeller = async (req, res) => {
    try {
        const { id } = req.params;
        const meals = await Meal.find({ sellerId: id });
        res.status(200).json({
            success: true,
            meals
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getMealById = async (req, res) => {
    try {
        const { id } = req.params;
        const meal = await Meal.findById(id).populate('sellerId', 'firstName lastName businessName profileImage description city');
        
        if (!meal) {
            return res.status(404).json({ success: false, message: "Meal not found" });
        }

        // Fetch reviews for this meal
        const reviews = await Review.find({ mealId: id }).populate('userId', 'firstName lastName profileImage');
        
        res.status(200).json({
            success: true,
            meal,
            reviews
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export default { createMeal, getAllMeals, getMyMeals, updateMeal, removeMeal, getMealsBySeller, getMealById };
