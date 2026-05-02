import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({

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

    items: [{
        mealId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Meal",
        },

        quantity: {
            type: Number,
            required: true
        }

    }],

    totalPayment: {
        type: Number,
        required: true
    },

    deliveryAddress: {
        type: String
    },

    contactNumber: {
        type: Number
    },

    paymentMethod: {
        type: String,
        enum: ["cash", "card"],
        default: "cash"
    },

    receiptImage: {
        type: String
    },

    paymentConfirmed: {
        type: Boolean,
        default: false
    },

    orderStatus: {
        type: String,
        enum: ["pending", "confirmed", "preparing", "ready", "cancelled"],
        default: "pending"
    },

    paymentMethod: {
        type: String,
        enum: ["cod", "bank_transfer", "cash", "card"],
        default: "cod",
    },

    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending",
    },

    specialInstructions: { type: String },

    cancelReason: { type: String },

    platformFee: {
        type: Number,
        default: 0
    },

    sellerEarnings: {
        type: Number,
        default: 0
    },
}, {
    timestamps: true
});

export default mongoose.model("Order", OrderSchema);