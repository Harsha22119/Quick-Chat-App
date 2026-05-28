/* 
  auth.js will authenticate the user. 
  Middleware is the function which is excuted before execting the controller function
  It protect our routes
  It will verify the token sent by the client
  If token is valid, it will allow the user to access the route
  If token is invalid, it will return an error
*/

import User from "../models/User.js";
import jwt from "jsonwebtoken";

// Middleware to protect routes
export const protectRoute = async (req, res, next) => {
    try {
        // Get token from headers
        const token = req.headers.token;
        if (!token) {
            return res.json({ success: false, message: "No token provided" });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user from token
        const user = await User.findById(decoded.userId).select("-password");
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        // Attach user to request object
        req.user = user;
        next();
    } catch (error) {
        console.error(error.message);
        res.json({ success: false, message: error.message });
    }
};