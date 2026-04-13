import 'dotenv/config';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/user.model.js';
import userRoutes from './routes/userRoutes.js';
import mealRoutes from './routes/mealRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import { Router } from 'express';
import CORS from 'cors';
import express from 'express';


const app = express();


app.use(CORS({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger - shows every incoming request in terminal
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

const connectDatabase = async () => {
    try {
        console.log(`Connecting to database: ${process.env.DATABASE_URL}`);
        await mongoose.connect(process.env.DATABASE_URL);
        console.log("Database Connected");
    } catch (err) {
        console.log("Database Connection Failed! ", err);
    }
};

connectDatabase();

const router = Router();

router.get('/', async (req, res) => {
    res.status(201).json({
        message: "Test Endpoint Works"
    });
})


app.use('/api/v1/users', userRoutes); //User Routes
app.use('/api/v1/meals', mealRoutes); //Meal Routes
app.use('/api/v1/orders', orderRoutes); //Order Routes
app.use('/api/v1/alerts', alertRoutes); //Alert Routes


const PORT = 3000;

app.listen(PORT, '0.0.0.0', () => {     // '0.0.0.0' reachable from phone on same network
    console.log(`Server is Running on http://localhost:${PORT}`);
    console.log(`Cloudinary Cloud: ${process.env.CLOUDINARY_CLOUD_NAME}`);
});