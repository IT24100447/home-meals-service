import mongoose from "mongoose";

const SpecialAlertSchema = new mongoose.Schema({
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
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    specialPrice: {
        type: Number,
        required: true
    },
    image: {
        type: String
    },
    offerType: {
        type: String,
        enum: ["Special Offer", "Other"],
        default: "Special Offer"
    },
    showOnTop: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

export default mongoose.model("SpecialAlert", SpecialAlertSchema);
