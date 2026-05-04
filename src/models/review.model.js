import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    sellerId: {
         type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    mealId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Meal",
        required: true
    },

    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
    },

    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },

    comment:{
        type: String
    },

    reviewPhoto: {
        type: String
    },

    sellerReply: {
        type: String
    }

},{
    timestamps: true
});

export default mongoose.model("Review", ReviewSchema); 