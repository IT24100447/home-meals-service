import Meal from '../models/meal.model.js';

const createMeal = async (mealData, file, sellerId) => {

    try {
        const imageUrl = file ? file.path : "https://res.cloudinary.com/ddo8xtk2a/image/upload/v1775966212/default-avatar-icon-of-social-media-user-vector_hrmo8x.jpg";
        const { mealName, description, category, mealType, price, portionSize, availableQuantity, tags } = mealData;

        if (mealType !== "veg" || "non-veg") {
            throw new Error("Invalid Meal Type");
        }

        if (category !== "Breakfast" || "Lunch" || "Dinner") {
            throw new Error("Invalid Category");
        }

        if (portionSize !== "Normal" || "Large") {
            throw new Error("Invalid Portion Size");
        }

        const meal = await Meal.create({
            sellerId, // Associate meal with the logged-in seller
            mealName,
            description,
            category,
            mealType,
            price,
            portionSize,
            availableQuantity,
            tags,
            image: imageUrl
        });

        console.log("Meal Has Been Created Sucessfully")
        return meal;

    } catch (err) {
        console.log("Error Creating Meal: ", err);
        throw new Error("Error Creating Meal");
    }
}




export default { createMeal }