import mongoose from "mongoose";

const AnalyticsSchema = new mongoose.Schema({

    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "seller",
        required: true
    },

    reportName: {
        type: String,
        required: true
    },

    startDate: {
        type: Date,
        required: true
    },

    endDate: {
        type: Date,
        required: true
    },

    totalRevenue: {
        type: Number,
        required: true,
        default: 0
    },

    totalOrders: {
        type: Number,
        default: 0
    },

    completedOrders: {
        type: Number,
        default: 0
    },

    cancelledOrders: {
        type: Number,
        default: 0
    },

    totalMealsSold: {
        type: Number,
        default: 0
    },

    topSellingMeal: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Meal",
        default: null
    },

    generatedAt: {
        type: Date,
        default: Date.now
    }

},{
    timestamps: true
});

module.exports = mongoose.model("Analytics", AnalyticsSchema);