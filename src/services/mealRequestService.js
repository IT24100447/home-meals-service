import MealRequest from "../models/mealRequest.model.js";

const createMealRequest = async (requestData, file, userId, userCity) => {
  try {
    const imageUrl = file ? file.path : null;
    const {
      requestedMealName,
      description,
      preferredCategory,
      preferredMealType,
      budgetRange,
      quantityNeeded,
      neededDate,
      deliveryLocation,
      city,
    } = requestData;

    const mealRequest = await MealRequest.create({
      userId,
      requestedMealName,
      description,
      preferredCategory,
      preferredMealType,
      budgetRange,
      quantityNeeded,
      neededDate,
      deliveryLocation,
      city: city || userCity, // Fallback to student's registered city
      prescriptionImage: imageUrl,
    });

    console.log("Meal Request created successfully");
    return mealRequest;
  } catch (err) {
    console.error("Error creating meal request:", err);
    throw new Error(err.message || "Error creating meal request");
  }
};

const getAvailableMealRequests = async (city) => {
  try {
    // Return pending requests in the seller's city
    return await MealRequest.find({ city, status: "pending" }).populate("userId", "firstName lastName phoneNumber");
  } catch (err) {
    console.error("Error fetching meal requests:", err);
    throw new Error("Error fetching meal requests");
  }
};

const getStudentMealRequests = async (userId) => {
  try {
    return await MealRequest.find({ userId }).populate("matchedSellerId", "businessName firstName lastName phoneNumber");
  } catch (err) {
    console.error("Error fetching student requests:", err);
    throw new Error("Error fetching student requests");
  }
};

const acceptMealRequest = async (requestId, sellerId) => {
  try {
    const request = await MealRequest.findById(requestId);
    if (!request) {
      throw new Error("Meal request not found");
    }
    if (request.status !== "pending") {
      throw new Error("Meal request is already " + request.status);
    }

    request.status = "accepted";
    request.matchedSellerId = sellerId;
    await request.save();

    console.log("Meal Request accepted by seller");
    return request;
  } catch (err) {
    console.error("Error accepting meal request:", err);
    throw new Error(err.message || "Error accepting meal request");
  }
};

export default {
  createMealRequest,
  getAvailableMealRequests,
  getStudentMealRequests,
  acceptMealRequest,
};
