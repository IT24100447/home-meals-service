import { Router } from "express";
import alertController from "../controllers/alertController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", authMiddleware, alertController.getMyAlerts);
router.put("/mark-all-read", authMiddleware, alertController.markAllAsRead);
router.put("/:id/read", authMiddleware, alertController.markAsRead);
router.delete("/:id", authMiddleware, alertController.deleteAlert);

export default router;
