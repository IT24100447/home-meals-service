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

const getAvailableMealRequests = async (city, sellerId) => {
  try {
    // Return pending requests in the seller's city OR requests accepted by this seller
    return await MealRequest.find({
      $or: [
        { city, status: "pending" },
        { matchedSellerId: sellerId, status: "accepted" },
        { matchedSellerId: sellerId, status: "fulfilled" }
      ]
    }).populate("userId", "firstName lastName phoneNumber");
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

const fulfillMealRequest = async (requestId, sellerId) => {
  try {
    const request = await MealRequest.findById(requestId);
    if (!request) {
      throw new Error("Meal request not found");
    }
    if (request.status !== "accepted") {
      throw new Error("Only accepted requests can be fulfilled");
    }
    if (request.matchedSellerId.toString() !== sellerId.toString()) {
      throw new Error("You are not authorized to fulfill this request");
    }

    request.status = "fulfilled";
    await request.save();

    console.log("Meal Request marked as fulfilled");
    return request;
  } catch (err) {
    console.error("Error fulfilling meal request:", err);
    throw new Error(err.message || "Error fulfilling meal request");
  }
};

const deleteMealRequest = async (requestId, userId) => {
  try {
    const request = await MealRequest.findById(requestId);
    if (!request) throw new Error("Meal request not found");
    if (request.userId.toString() !== userId.toString())
      throw new Error("Not authorized to delete this request");
    if (request.status !== "pending")
      throw new Error("Only pending requests can be deleted");

    await MealRequest.findByIdAndDelete(requestId);
    console.log("Meal Request deleted successfully");
    return request;
  } catch (err) {
    console.error("Error deleting meal request:", err);
    throw new Error(err.message || "Error deleting meal request");
  }
};

export default {
  createMealRequest,
  getAvailableMealRequests,
  getStudentMealRequests,
  acceptMealRequest,
  fulfillMealRequest,
  deleteMealRequest,
};
