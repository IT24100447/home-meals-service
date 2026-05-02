import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const authMiddleware = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            console.log("Incoming Token Verification...");
            
            const decoded = jwt.verify(token, process.env.JWT_KEY);
            req.user = await User.findById(decoded.id).select('-password');
            
            if (!req.user) {
                console.log("Verification Failed: User not found in DB");
                return res.status(401).json({ success: false, message: "User not found" });
            }
            
            console.log("Verification Success: ", req.user.email);
            return next();
        } catch (err) {
            console.log("Authorization Failed! ", err);
            return res.status(401).json({
                success: false,
                message: "Not Authorized! Invalid Token"
            });
        }
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Not Authorized! No Token"
        });
    }
}

// Role-based authorization
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.user?.role} is not authorized to access this route`
            });
        }
        next();
    };
};

export default authMiddleware;