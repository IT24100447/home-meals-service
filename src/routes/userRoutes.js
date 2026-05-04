import userController from '../controllers/userController.js';
import { Router } from "express";
import authMiddleware from '../middleware/authMiddleware.js';
import { upload } from '../services/cloudinaryConfig.js';

const router = Router();

router.post('/register', upload.single('profileImage'), userController.registerUser);
router.get('/sellers', userController.getSellers);
router.get('/sellers/:id', userController.getSellerProfile);
router.get('/profile', authMiddleware, userController.getProfile);
router.post('/login', userController.userLogin);
router.post('/reset-password', userController.resetPassword);
router.put('/profile', authMiddleware, upload.single('profileImage'), userController.updateProfile);
router.post('/wishlist/:mealId', authMiddleware, userController.toggleWishlist);
router.get('/wishlist', authMiddleware, userController.getWishlist);
router.get('/:email', userController.findUserByEmail);
export default router;
