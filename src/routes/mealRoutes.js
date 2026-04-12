import { Router } from "express";
import mealController from "../controllers/mealController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { upload } from "../services/cloudinaryConfig.js";

const router = Router();

router.post("/create", authMiddleware, upload.single('image'), mealController.createMeal);
router.get("/all", mealController.getAllMeals);

export default router;
