import userController from '../controllers/userController.js';
import { Router } from "express";
import authMiddleware from '../middleware/authMiddleware.js';
import { upload } from './cloudinaryConfig.js';

const router = Router();

router.post('/register', upload.single('profileImage'), userController.registerUser);
router.get('/:email', userController.findUserByEmail);
router.post('/login', userController.userLogin);

export default router;
