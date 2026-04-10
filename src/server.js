import express from 'express';
import dotenv from  'dotenv';
import mongoose from 'mongoose';
import userRoutes from './routes/userRoutes.js';
import { Router } from 'express';
import CORS from 'cors';



const cors = CORS;
const app = express();
app.use(express.json());
const PORT = 3000;

app.listen(PORT,() => {
    console.log(`Server is Running on https//:localhost:${PORT}`)
});

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

app.use(cors({
  origin: 'http://localhost:8081',
  credentials: true
}));


app.use('/api/user', userRoutes); //User Routes


