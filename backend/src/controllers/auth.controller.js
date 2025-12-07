import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { upsertStreamUser } from "../lib/Stream.js";

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email' });
        }

        const isPasswordValid = await user.matchPassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
            expiresIn: '7d'
        })

        res.cookie('jwt', token, {
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict'
        });

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            user
        });

    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const signup = async (req, res) => {
    const { fullName, email, password } = req.body;

    try {
        if (!fullName || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        if (await User.findOne({ email })) {
            return res.status(400).json({ message: 'Email already in use, please choose another one' });
        }

        const idx = Math.floor(Math.random() * 100) + 1; // generate random number between 1 and 100
        const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

        const newUser = new User({
            fullName,
            email,
            password,
            profilePicture: randomAvatar
        });

        await newUser.save();

        try {
            await upsertStreamUser({
                id: newUser._id.toString(),
                name: newUser.fullName,
                image: newUser.profilePicture || ""
            })
            console.log(`Stream user created successfully for ${newUser.fullName}`);
        } catch (error) {
            console.log('Error creating Stream user');
        }

        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET_KEY, {
            expiresIn: '7d'
        });

        res.cookie('jwt', token, {
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict'
        });

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: newUser
        });
    } catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}

export const logout = (req, res) => {
    res.clearCookie('jwt', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict'
    });
    return res.status(200).json({ success: true, message: 'Logout successful' });
}

export const onboard = async (req, res) => {
    try {
        const userId = req.user._id;

        const { bio, nativeLanguage, learningLanguage, location, profilePicture } = req.body;

        if (!bio || !nativeLanguage || !learningLanguage || !location) {
            return res.status(400).json({
                message: 'All fields are required for onboarding',
                missingFields: [
                    !bio && 'bio',
                    !nativeLanguage && 'nativeLanguage',
                    !learningLanguage && 'learningLanguage',
                    !location && 'location'
                ].filter(Boolean)
            });
        }

        const updatedUser = await User.findByIdAndUpdate(userId, {
            ...req.body,
            isOnboarded: true
        }, { new: true });  

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        try {
            await upsertStreamUser({
                id: updatedUser._id.toString(),
                name: updatedUser.fullName,
                image: updatedUser.profilePicture || ""
            });
            console.log(`Stream user updated successfully for ${updatedUser.fullName}`);
        } catch (error) {
            console.log('Error updating Stream user', error);
        }

        res.status(200).json({
            success: true,
            message: 'User onboarded successfully',
            user: updatedUser
        });

    } catch (error) {
        console.error('Onboarding error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}

export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Get user error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}