import mealService from "../services/mealService.js";

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
}

export default { createMeal, getAllMeals };
