import mealRequestService from "../services/mealRequestService.js";

const createRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const userCity = req.user.city;
    const mealRequest = await mealRequestService.createMealRequest(
      req.body,
      req.file,
      userId,
      userCity
    );
    res.status(201).json({
      success: true,
      mealRequest,
      message: "Meal request submitted successfully",
    });
  } catch (err) {
    console.error("Create Meal Request Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAvailableRequests = async (req, res) => {
  try {
    const city = req.user.city; // Seller's city
    const sellerId = req.user.id;
    const requests = await mealRequestService.getAvailableMealRequests(city, sellerId);
    res.status(200).json({ success: true, requests });
  } catch (err) {
    console.error("Get Available Requests Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMyRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const requests = await mealRequestService.getStudentMealRequests(userId);
    res.status(200).json({ success: true, requests });
  } catch (err) {
    console.error("Get My Requests Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const acceptRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user.id;
    const request = await mealRequestService.acceptMealRequest(id, sellerId);
    res.status(200).json({
      success: true,
      request,
      message: "You have accepted this meal request",
    });
  } catch (err) {
    console.error("Accept Request Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export default {
  createRequest,
  getAvailableRequests,
  getMyRequests,
  acceptRequest,
};
