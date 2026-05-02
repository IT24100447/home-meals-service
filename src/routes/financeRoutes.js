import { Router } from "express";
import financeController from "../controllers/financeController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { upload } from "../services/cloudinaryConfig.js";

const router = Router();

// 1. Student uploads bank slip
router.post('/upload-slip', authMiddleware, upload.single('bankSlip'), financeController.uploadBankSlip);

// 2. Seller views their payments
router.get('/seller/payments/:sellerId', authMiddleware, financeController.getSellerPayments);

// 3. Seller verifies a payment
router.patch('/verify/:paymentId', authMiddleware, financeController.verifyPayment);

// 4. Financial Report Data
router.get('/report/:sellerId', authMiddleware, financeController.getFinancialReport);

// 5. Seller adds an expense (materials, bills, etc.)
router.post('/expenses', authMiddleware, upload.single('bill'), financeController.addExpense);

// 6. Seller gets their expenses
router.get('/expenses/:sellerId', authMiddleware, financeController.getExpenses);

export default router;
