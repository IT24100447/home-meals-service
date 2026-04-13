import { Router } from "express";
import alertController from "../controllers/alertController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", authMiddleware, alertController.getMyAlerts);
router.put("/:id/read", authMiddleware, alertController.markAsRead);

export default router;
