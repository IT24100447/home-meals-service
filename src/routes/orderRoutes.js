import { Router } from "express";
import orderController from "../controllers/orderController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = Router();

router.post("/", authMiddleware, orderController.placeOrder);
router.get("/my-orders", authMiddleware, orderController.getMyOrders);
router.put("/:id/status", authMiddleware, orderController.updateStatus);

export default router;
