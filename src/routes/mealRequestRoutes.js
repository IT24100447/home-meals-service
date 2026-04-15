import { Router } from "express";
import mealRequestController from "../controllers/mealRequestController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { upload } from "../services/cloudinaryConfig.js";

const router = Router();

// Student routes
router.post("/", authMiddleware, upload.single('prescriptionImage'), mealRequestController.createRequest);
router.get("/my-requests", authMiddleware, mealRequestController.getMyRequests);

// Seller routes
router.get("/available", authMiddleware, mealRequestController.getAvailableRequests);
router.put("/accept/:id", authMiddleware, mealRequestController.acceptRequest);

export default router;
