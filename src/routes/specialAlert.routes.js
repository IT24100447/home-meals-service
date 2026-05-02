import express from "express";
import {
    createSpecialAlert,
    getSellerSpecialAlerts,
    getAllSpecialAlerts,
    updateSpecialAlert,
    deleteSpecialAlert
} from "../controllers/specialAlert.controller.js";
import protect, { authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/all", getAllSpecialAlerts);
router.post("/", protect, authorize("seller"), createSpecialAlert);
router.get("/seller", protect, authorize("seller"), getSellerSpecialAlerts);
router.put("/:id", protect, authorize("seller"), updateSpecialAlert);
router.delete("/:id", protect, authorize("seller"), deleteSpecialAlert);

export default router;
