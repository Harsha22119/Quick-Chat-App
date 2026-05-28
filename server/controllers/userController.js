import bcrypt from "bcryptjs";
import User from "../models/User.js";
import {generateToken} from "../lib/utils.js";
import cloudinary from "../lib/cloudinary.js";

// Signup a new user
export const signup = async (req, res) => {
    const { fullName, email, password, bio } = req.body;

    console.log("In signup backen")
    try {
        // Validate fields
        if (!fullName || !email || !password || !bio) {
            return res.status(400).json({ success: false, message: "Missing details" });
        }

        // Check if user already exists
        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ success: false, message: "Account already exists" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = await User.create({
            fullName,
            email,
            password: hashedPassword,
            bio,
        });

        // Generate token
        const token = generateToken(newUser._id);

        res.status(201).json({
            success: true,
            userData: newUser,
            token,
            message: "Account created successfully",
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// controller for user login
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.json({ success: false, message: "Missing email or password" });
        }

        // Check if user exists
        const userData = await User.findOne({ email });
        if (!userData) {
            return res.json({ success: false, message: "User not found" });
        }

        // Compare passwords
        const isPasswordCorrect = await bcrypt.compare(password, userData.password);
        if (!isPasswordCorrect) {
            console.log("Invalid credentials")
            return res.json({ success: false, message: "Invalid credentials" });
        }

        // Generate token
        const token = generateToken(userData._id);

        res.json({
            success: true,
            userData,
            token,
            message: "Login successful",
        });
    } catch (error) {
        console.error(error.message);
        res.json({ success: false, message: error.message });
    }
};

// Controller to check user authenticated or not
export const checkAuth = async (req, res) => {
    res.json({ success: true, user: req.user });
};

// Controller to update user profile details
export const updateProfile = async (req, res) => {
    try {
        const { profilePic, bio, fullName } = req.body;
        const userId = req.user._id;

        let updatedUser;

        if (!profilePic) {
            // Update only bio and fullName
            updatedUser = await User.findByIdAndUpdate(
                userId,
                { bio, fullName },
                { new: true }
            );
        } else {
            // Upload new profile picture to Cloudinary
            const upload = await cloudinary.uploader.upload(profilePic);
            updatedUser = await User.findByIdAndUpdate(
                userId,
                { profilePic: upload.secure_url, bio, fullName },
                { new: true }
            );
        }

        res.json({
            success: true,
            user: updatedUser,
            message: "Profile updated successfully",
        });
    } catch (error) {
        console.error(error.message);
        res.json({ success: false, message: error.message });
    }
};