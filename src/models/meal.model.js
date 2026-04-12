import mongoose from "mongoose";

const MealSchema = new mongoose.Schema({

    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    mealName: {
        type: String,
        required: true
    },

    description: {
        type: String
    },

    category: {
        type: String,
        enum: ["Breakfast", "Lunch", "Dinner"],
        required: true
    },

    mealType: {
        type: String,
        enum: ["veg", "non-veg"]
    },

    price: {
        type: Number,
        required: true
    },

    portionSize: {
        type: String,
        enum: ["Normal", "Large"],
        required: true
    },

    image: {
        type: String
    },

    availableQuantity: {
        type: Number,
        default: 0
    },

    averageRating: {
        type: Number,
        default: 0
    },

    totalOrders: {
        type: Number,
        default: 0
    },

    tags: [{ type: String }]
}, {
    timestamps: true
}
);

export default mongoose.model("Meal", MealSchema);