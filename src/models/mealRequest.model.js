import mongoose from "mongoose";

const mealRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    requestedMealName: { type: String, required: true },
    description: { type: String },
    preferredCategory: {
      type: String,
      enum: ["breakfast", "lunch", "dinner"],
    },
    preferredMealType: {
      type: String,
      enum: ["veg", "non-veg"],
    },
    budgetRange: { type: Number },
    quantityNeeded: { type: Number },
    neededDate: { type: Date },
    deliveryLocation: { type: String },
    city: { type: String, required: true },
    prescriptionImage: { type: String },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "fulfilled"],
      default: "pending",
    },
    matchedSellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("MealRequest", mealRequestSchema);
