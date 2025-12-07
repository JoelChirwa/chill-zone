import express from 'express';
import { login, logout, onboard, signup, getMe } from '../controllers/auth.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post("/login", login);
router.post("/signup", signup);
router.post("/logout", logout);
router.post("/onboarding", protectRoute, onboard);
router.get("/me", protectRoute, getMe);



export default router;