import userController from '../controllers/userController';
import { Router } from "express";


Router.post('/api/user/register', userController.registerUser);
Router.get('/:email',userController.findUserByEmail)
Router.post('/api/user/login', userController.userLogin);

module.exports = { Router };
