import mongoose from "mongoose";

const MealSchema = new mongoose.Schema({

    sellerId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Seller",
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
        enum: ["Normal","Large"]
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
},{
    timestamps: true
}
);

module.exports = mongoose.model("Meal",MealSchema);