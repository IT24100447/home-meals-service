import express from "express";
import {
    createSpecialAlert,
    getSellerSpecialAlerts,
    getAllSpecialAlerts,
    updateSpecialAlert,
    deleteSpecialAlert
} from "../controllers/specialAlert.controller.js";
import protect, { authorize } from "../middleware/authMiddleware.js";
import { upload } from "../services/cloudinaryConfig.js";

const router = express.Router();

router.get("/all", getAllSpecialAlerts);
router.post("/", protect, authorize("seller"), upload.single('image'), createSpecialAlert);
router.get("/seller", protect, authorize("seller"), getSellerSpecialAlerts);
router.put("/:id", protect, authorize("seller"), upload.single('image'), updateSpecialAlert);
router.delete("/:id", protect, authorize("seller"), deleteSpecialAlert);

export default router;
