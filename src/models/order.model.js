import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Seller",
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

    orderStatus: {
        type: String,
        enum: ["pending",
        "confirmed",
        "preparing",
        "out_for_delivery",
        "delivered",
        "cancelled",],
        default: "pending"
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "card"],
      default: "cash",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    specialInstructions: { type: String },

    cancelReason: { type: String },
},{
    timestamps: true
});

module.exports = mongoose.model("Order",OrderSchema);