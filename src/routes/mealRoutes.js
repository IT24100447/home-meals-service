import { Router } from "express";
import mealController from "../controllers/mealController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { upload } from "../services/cloudinaryConfig.js";

const router = Router();

router.post("/", authMiddleware, upload.single('image'), mealController.createMeal);
router.get("/mine", authMiddleware, mealController.getMyMeals);
router.get("/", mealController.getAllMeals);
router.get("/seller/:id", mealController.getMealsBySeller);
router.get("/:id", mealController.getMealById);
router.put("/:id", authMiddleware, upload.single('image'), mealController.updateMeal);
router.delete("/:id", authMiddleware, mealController.removeMeal);

export default router;
