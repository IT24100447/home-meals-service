import Meal from '../models/meal.model.js';

const createMeal = async (mealData, file, sellerId) => {

    try {
        const imageUrl = file ? file.path : "https://res.cloudinary.com/ddo8xtk2a/image/upload/v1775966212/default-avatar-icon-of-social-media-user-vector_hrmo8x.jpg";
        const { mealName, description, category, mealType, price, portionSize, availableQuantity, tags } = mealData;

        if (!["veg", "non-veg"].includes(mealType)) {
            throw new Error("Invalid Meal Type");
        }

        if (!["Breakfast", "Lunch", "Dinner"].includes(category)) {
            throw new Error("Invalid Category");
        }

        if (!["Normal", "Large"].includes(portionSize)) {
            throw new Error("Invalid Portion Size");
        }

        const meal = await Meal.create({
            sellerId,
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

const removeMeal = async (mealId) => {

    const meal = await Meal.findById(mealId);

    if (!meal) {
        throw new Error("Meal Not Found");
    }

    await Meal.findByIdAndDelete(mealId);
    console.log("Meal Has Been Deleted Sucessfully");
    return meal;
}

const updateMeal = async (mealId, mealData, file) => {
    try {
        const meal = await Meal.findById(mealId);
        if (!meal) {
            throw new Error("Meal Not Found");
        }

        const { mealName, description, category, mealType, price, portionSize, availableQuantity, tags } = mealData;

        if (mealName) meal.mealName = mealName;
        if (description) meal.description = description;
        if (category) meal.category = category;
        if (mealType) meal.mealType = mealType;
        if (price) meal.price = price;
        if (portionSize) meal.portionSize = portionSize;
        if (availableQuantity) meal.availableQuantity = availableQuantity;
        if (tags) meal.tags = tags;

        if (file) {
            meal.image = file.path;
        }

        await meal.save();
        console.log("Meal Has Been Updated Successfully");
        return meal;

    } catch (err) {
        console.log("Error Updating Meal: ", err);
        throw new Error(err.message || "Error Updating Meal");
    }
}

export default { createMeal, removeMeal, updateMeal }