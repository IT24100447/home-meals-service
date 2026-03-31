import userController from '../controllers/userController.js';
import { Router } from "express";

const router = Router();

router.post('/register', userController.registerUser);
router.get('/:email', userController.findUserByEmail);
router.post('/login', userController.userLogin);

export default router;
