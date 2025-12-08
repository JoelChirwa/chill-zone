import express from 'express';
import dotenv from 'dotenv'; 
import authRouter from './routes/auth.route.js'; 
import userRouter from './routes/user.route.js';
import chatRouter from './routes/chat.route.js';
import connectDB from './lib/db.js'; 
import cookieParser from "cookie-parser"
import cors from 'cors';
import { protectRoute } from './middleware/auth.middleware.js';

dotenv.config();
  

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true, // Allow cookies to be sent from the frontend
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/chat', chatRouter);


app.get('/me', protectRoute, (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});
