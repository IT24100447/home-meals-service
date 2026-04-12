import 'dotenv/config'; // MUST be first - loads env vars before any other module runs
import express from 'express';
import mongoose from 'mongoose';
import userRoutes from './routes/userRoutes.js';
import CORS from 'cors';

const app = express();

// Allow requests from any origin (needed for Expo Go on physical devices)
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

const connectDatabase = async() => {
    try{
        await mongoose.connect(process.env.DATABASE_URL);
        console.log("Database Connected");
    } catch (err){
        console.log("Database Connection Failed! ", err);
    }
};

connectDatabase();

app.use('/api/user', userRoutes); //User Routes

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {     // '0.0.0.0' makes it reachable from phone on same network
    console.log(`Server is Running on http://localhost:${PORT}`);
    console.log(`Cloudinary Cloud: ${process.env.CLOUDINARY_CLOUD_NAME}`); // Verify env loaded
});
