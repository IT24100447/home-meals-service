import mealService from "../services/mealService.js";
import Meal from "../models/meal.model.js";

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
        const meals = await Meal.find().populate('sellerId', 'firstName lastName businessName city');
        res.status(200).json({
            success: true,
            meals
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

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

export default { createMeal, getAllMeals, getMyMeals, removeMeal };
