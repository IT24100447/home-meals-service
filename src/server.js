import express from 'express';
import dotenv from  'dotenv';
import mongoose from 'mongoose';
import userRoutes from './routes/userRoutes.js';
import { Router } from 'express';
import CORS from 'cors';



const app = express();
app.use(CORS());
app.use(express.json());

dotenv.config();

const connectDatabase = async() => {
    try{
        await mongoose.connect(process.env.DATABASE_URL);
        console.log("Database Connected");
    } catch (err){
        console.log("Database Connection Failed! ",err);
    }
};

connectDatabase();

const router = Router();

router.get('/', async(req,res) => {
    res.status(201).json({
        message: "Test Endpoint Works"
    });
})


app.use('/api/user', userRoutes); //User Routes


const PORT = 3000;

app.listen(PORT,() => {
    console.log(`Server is Running on http//:localhost:${PORT}`)
});
